import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import api from '../services/api';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import {
  getOrGenerateUserKeypair,
  exportPublicKeySpki,
  getConversationKey,
  encryptMessage,
  decryptMessage,
} from '../utils/crypto';

export const ChatContext = createContext(null);

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const ChatProvider = ({ children }) => {
  const { user, updateCurrentUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [e2eeError, setE2eeError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [mobileView, setMobileView] = useState('list');

  // Cache my private key in memory across the session
  const myPrivateKeyRef = useRef(null);

  // Keep references to current states for stable WebSocket callbacks
  const activeConversationRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const stompClientRef = useRef(null);
  const activeConvSubRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const [isKeyReady, setIsKeyReady] = useState(false);

  // Helper to ensure my private key is loaded on-demand without race conditions
  const getMyPrivateKey = useCallback(async () => {
    if (myPrivateKeyRef.current) return myPrivateKeyRef.current;
    if (!userRef.current?.id || USE_MOCK) return null;
    try {
      const kp = await getOrGenerateUserKeypair(userRef.current.id);
      myPrivateKeyRef.current = kp.privateKey;
      return kp.privateKey;
    } catch (err) {
      console.warn('Failed to retrieve private key on demand:', err);
      return null;
    }
  }, []);

  // Initialize E2EE keypair once user is logged in and self-heal backend public key if mismatched
  useEffect(() => {
    if (!user || USE_MOCK) {
      setIsKeyReady(false);
      return;
    }

    let isMounted = true;
    const initKeypair = async () => {
      try {
        const kp = await getOrGenerateUserKeypair(user.id);
        if (!isMounted) return;
        myPrivateKeyRef.current = kp.privateKey;
        setIsKeyReady(true);

        // Self-heal: ensure backend has matching public key for this local private key
        const localPubSpki = await exportPublicKeySpki(kp.publicKey);
        if (!user.publicKey || user.publicKey !== localPubSpki) {
          try {
            const updateRes = await api.put('/users/me/public-key', { publicKey: localPubSpki });
            if (updateRes.data && isMounted) {
              updateCurrentUser(updateRes.data);
            }
          } catch (syncErr) {
            console.warn('E2EE key synchronization notice:', syncErr.message);
          }
        }
      } catch (err) {
        console.warn('E2EE keypair initialization failed:', err.message);
      }
    };

    initKeypair();
    return () => {
      isMounted = false;
    };
  }, [user?.id, updateCurrentUser]);

  /**
   * Helper to decrypt an incoming single message with peer public key
   */
  const decryptSingleMessage = useCallback(
    async (msg, peer) => {
      if (!msg.ciphertext || !msg.nonce) {
        return { ...msg, content: msg.content || '[no content]', isDecrypted: false };
      }

      if (USE_MOCK) {
        try {
          const text = atob(msg.ciphertext);
          return { ...msg, content: text, isDecrypted: true };
        } catch {
          return { ...msg, content: msg.ciphertext, isDecrypted: false };
        }
      }

      const myPrivKey = await getMyPrivateKey();
      if (!myPrivKey || !userRef.current) {
        return { ...msg, content: '[🔐 E2EE — key unavailable]', isDecrypted: false };
      }

      // Identify the peer
      let peerUser = peer;
      if (!peerUser || peerUser.id === userRef.current.id) {
        const peerId = msg.senderId === userRef.current.id ? msg.receiverId : msg.senderId;
        peerUser = activeConversationRef.current?.participant?.id === peerId
          ? activeConversationRef.current.participant
          : conversations.find((c) => c.participant?.id === peerId)?.participant || { id: peerId };
      }

      let peerPublicKey = peerUser?.publicKey || null;

      // If peer public key is missing on client, dynamically fetch fresh user details
      if (!peerPublicKey && peerUser?.id) {
        try {
          const freshPeer = await userService.getUserById(peerUser.id);
          if (freshPeer?.publicKey) {
            peerPublicKey = freshPeer.publicKey;
            peerUser.publicKey = peerPublicKey;
          }
        } catch (fetchErr) {
          console.warn('Could not fetch peer public key for decryption:', fetchErr);
        }
      }

      if (!peerPublicKey) {
        return { ...msg, content: '[🔐 E2EE — key unavailable]', isDecrypted: false };
      }

      try {
        const aesKey = await getConversationKey(
          userRef.current.id,
          myPrivKey,
          peerUser.id,
          peerPublicKey
        );
        const plaintext = await decryptMessage(msg.ciphertext, msg.nonce, aesKey);
        return { ...msg, content: plaintext, isDecrypted: true };
      } catch (e) {
        console.warn('Message decryption failed:', e.message);
        return { ...msg, content: '[🔐 Decryption failed]', isDecrypted: false };
      }
    },
    [getMyPrivateKey, conversations]
  );

  /**
   * Decrypt an array of raw message objects from the backend.
   */
  const decryptMessages = useCallback(
    async (rawMessages, peer) => {
      if (!userRef.current || !peer || USE_MOCK) {
        return rawMessages.map((m) => ({ ...m, content: m.ciphertext || m.content || '' }));
      }

      return Promise.all(rawMessages.map((msg) => decryptSingleMessage(msg, peer)));
    },
    [decryptSingleMessage]
  );

  const fetchConversations = useCallback(async (showLoading = false) => {
    if (!userRef.current) return;
    if (showLoading) setIsLoadingConversations(true);
    try {
      const data = await chatService.getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (showLoading) setIsLoadingConversations(false);
    }
  }, []);

  // Fetch initial conversations on user login (keyed to user.id to prevent spurious refetches)
  useEffect(() => {
    if (user?.id) {
      fetchConversations(true);
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      myPrivateKeyRef.current = null;
      processedMessageIds.current.clear();
    }
  }, [user?.id, fetchConversations]);

  // Load and decrypt messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      setE2eeError(null);
      processedMessageIds.current.clear();
      return;
    }

    const currentPeer = activeConversation.participant;

    // Check if peer public key is missing and dynamically resolve in background
    if (!currentPeer?.publicKey && currentPeer?.id && !USE_MOCK) {
      userService.getUserById(currentPeer.id).then((fresh) => {
        if (fresh?.publicKey) {
          setActiveConversation((prev) =>
            prev && prev.participant?.id === fresh.id
              ? { ...prev, participant: { ...prev.participant, publicKey: fresh.publicKey } }
              : prev
          );
        }
      }).catch(() => {});
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      setE2eeError(null);
      try {
        const raw = await chatService.getMessages(activeConversation.id);
        if (raw && Array.isArray(raw)) {
          processedMessageIds.current.clear();
          raw.forEach((m) => {
            if (m.id) processedMessageIds.current.add(m.id);
          });
        }
        const decrypted = await decryptMessages(raw || [], currentPeer);
        setMessages(decrypted);

        if (activeConversation.unreadCount > 0) {
          const updatedConvs = await chatService.markMessageAsRead(activeConversation.id);
          if (Array.isArray(updatedConvs)) {
            setConversations(updatedConvs);
          } else {
            setConversations((prev) =>
              prev.map((c) => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversation?.id, isKeyReady, decryptMessages]);

  // Handle presence & profile events in Mock Mode
  useEffect(() => {
    if (!USE_MOCK) return;

    const handleMockProfile = (e) => {
      const updatedUser = e.detail;
      if (!updatedUser) return;

      setConversations((prev) =>
        prev.map((c) =>
          c.participant?.id === updatedUser.id
            ? { ...c, participant: { ...c.participant, ...updatedUser } }
            : c
        )
      );

      if (activeConversationRef.current?.participant?.id === updatedUser.id) {
        setActiveConversation((prev) =>
          prev ? { ...prev, participant: { ...prev.participant, ...updatedUser } } : prev
        );
      }
    };

    const handleMockPresence = (e) => {
      const { userId, online, statusMessage } = e.detail || {};
      if (!userId) return;

      setConversations((prev) =>
        prev.map((c) =>
          c.participant?.id === userId
            ? {
                ...c,
                participant: {
                  ...c.participant,
                  online,
                  ...(statusMessage !== undefined ? { statusMessage } : {}),
                },
              }
            : c
        )
      );

      if (activeConversationRef.current?.participant?.id === userId) {
        setActiveConversation((prev) =>
          prev
            ? {
                ...prev,
                participant: {
                  ...prev.participant,
                  online,
                  ...(statusMessage !== undefined ? { statusMessage } : {}),
                },
              }
            : prev
        );
      }
    };

    window.addEventListener('mock_profile_update', handleMockProfile);
    window.addEventListener('mock_presence_update', handleMockPresence);

    return () => {
      window.removeEventListener('mock_profile_update', handleMockProfile);
      window.removeEventListener('mock_presence_update', handleMockPresence);
    };
  }, []);

  // Set up or tear down topic subscription when active conversation changes
  const setupActiveConvSubscription = useCallback(
    (clientInstance) => {
      const client = clientInstance || stompClientRef.current;
      if (!client || !client.connected) return;

      if (activeConvSubRef.current) {
        activeConvSubRef.current.unsubscribe();
        activeConvSubRef.current = null;
      }

      const activeConv = activeConversationRef.current;
      if (!activeConv) return;

      activeConvSubRef.current = client.subscribe(
        `/topic/conversations/${activeConv.id}`,
        async (stompMessage) => {
          try {
            const incomingMsg = JSON.parse(stompMessage.body);
            if (!incomingMsg || !incomingMsg.id) return;

            // Deduplicate immediately before expensive async decryption
            if (processedMessageIds.current.has(incomingMsg.id)) return;
            processedMessageIds.current.add(incomingMsg.id);

            const decrypted = await decryptSingleMessage(incomingMsg, activeConv.participant);
            setMessages((prev) => {
              if (prev.some((m) => m.id === decrypted.id)) return prev;
              return [...prev, decrypted];
            });

            setConversations((prevConvs) => {
              const targetIdx = prevConvs.findIndex((c) => c.id === activeConv.id);
              if (targetIdx !== -1) {
                const updated = { ...prevConvs[targetIdx], lastMessage: incomingMsg };
                const remaining = prevConvs.filter((_, idx) => idx !== targetIdx);
                return [updated, ...remaining];
              }
              return prevConvs;
            });
          } catch (e) {
            console.error('Active conversation STOMP payload error:', e);
          }
        }
      );
    },
    [decryptSingleMessage]
  );

  // Persistent WebSocket / STOMP real-time connection for active user session
  useEffect(() => {
    if (USE_MOCK || !user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const wsUrl = apiBase
      .replace('/api', '/ws')
      .replace(/^http:\/\//, 'ws://')
      .replace(/^https:\/\//, 'wss://');

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        logWebSocket('STOMP client connected successfully');

        // 1. Subscribe to Live Presence updates (online / offline / status)
        client.subscribe('/topic/presence', (stompMessage) => {
          try {
            const event = JSON.parse(stompMessage.body);
            if (!event || !event.userId) return;

            const { userId, email, online, statusMessage } = event;

            // Live update in conversations list
            setConversations((prev) =>
              prev.map((c) => {
                if (c.participant?.id === userId || c.participant?.email === email) {
                  return {
                    ...c,
                    participant: {
                      ...c.participant,
                      online,
                      ...(statusMessage !== undefined ? { statusMessage } : {}),
                    },
                  };
                }
                return c;
              })
            );

            // Live update in active conversation header
            if (
              activeConversationRef.current?.participant?.id === userId ||
              activeConversationRef.current?.participant?.email === email
            ) {
              setActiveConversation((prev) =>
                prev
                  ? {
                      ...prev,
                      participant: {
                        ...prev.participant,
                        online,
                        ...(statusMessage !== undefined ? { statusMessage } : {}),
                      },
                    }
                  : prev
              );
            }

            // Live update in search results
            setSearchResults((prev) =>
              prev.map((u) =>
                u.id === userId || u.email === email
                  ? { ...u, online, ...(statusMessage !== undefined ? { statusMessage } : {}) }
                  : u
              )
            );

            // Live update for current user self only if changed
            if (userRef.current?.id === userId || userRef.current?.email === email) {
              const current = userRef.current;
              if (current && (current.online !== online || (statusMessage !== undefined && current.statusMessage !== statusMessage))) {
                updateCurrentUser({ online, ...(statusMessage !== undefined ? { statusMessage } : {}) });
              }
            }
          } catch (e) {
            console.error('Error handling presence message:', e);
          }
        });

        // 2. Subscribe to Live Profile updates (name, avatar, statusMessage, online, publicKey)
        client.subscribe('/topic/users/profile', (stompMessage) => {
          try {
            const event = JSON.parse(stompMessage.body);
            if (!event || !event.userId) return;

            const { userId, name, avatar, statusMessage, online, publicKey } = event;

            // Live update in conversation list
            setConversations((prev) =>
              prev.map((c) => {
                if (c.participant?.id === userId) {
                  return {
                    ...c,
                    participant: {
                      ...c.participant,
                      ...(name ? { name } : {}),
                      ...(avatar ? { avatar } : {}),
                      ...(statusMessage !== undefined ? { statusMessage } : {}),
                      ...(online !== undefined ? { online } : {}),
                      ...(publicKey ? { publicKey } : {}),
                    },
                  };
                }
                return c;
              })
            );

            // Live update in active conversation
            if (activeConversationRef.current?.participant?.id === userId) {
              setActiveConversation((prev) =>
                prev
                  ? {
                      ...prev,
                      participant: {
                        ...prev.participant,
                        ...(name ? { name } : {}),
                        ...(avatar ? { avatar } : {}),
                        ...(statusMessage !== undefined ? { statusMessage } : {}),
                        ...(online !== undefined ? { online } : {}),
                        ...(publicKey ? { publicKey } : {}),
                      },
                    }
                  : prev
              );
            }

            // Live update in search results
            setSearchResults((prev) =>
              prev.map((u) =>
                u.id === userId
                  ? {
                      ...u,
                      ...(name ? { name } : {}),
                      ...(avatar ? { avatar } : {}),
                      ...(statusMessage !== undefined ? { statusMessage } : {}),
                      ...(online !== undefined ? { online } : {}),
                      ...(publicKey ? { publicKey } : {}),
                    }
                  : u
              )
            );

            // Live update for current user
            if (userRef.current?.id === userId) {
              updateCurrentUser({
                ...(name ? { name } : {}),
                ...(avatar ? { avatar } : {}),
                ...(statusMessage !== undefined ? { statusMessage } : {}),
                ...(online !== undefined ? { online } : {}),
                ...(publicKey ? { publicKey } : {}),
              });
            }
          } catch (e) {
            console.error('Error handling profile update message:', e);
          }
        });

        // 3. Subscribe to User-Specific Messages (instant real-time notifications across all chats)
        client.subscribe(`/topic/users/${user.id}/messages`, async (stompMessage) => {
          try {
            const incomingMsg = JSON.parse(stompMessage.body);
            if (!incomingMsg || !incomingMsg.id) return;

            const convId = incomingMsg.conversationId;
            const currentActive = activeConversationRef.current;

            // If the message is for the currently open conversation
            if (currentActive && currentActive.id === convId) {
              if (!processedMessageIds.current.has(incomingMsg.id)) {
                processedMessageIds.current.add(incomingMsg.id);
                const decrypted = await decryptSingleMessage(incomingMsg, currentActive.participant);
                setMessages((prev) => {
                  if (prev.some((m) => m.id === decrypted.id)) return prev;
                  return [...prev, decrypted];
                });
              }

              // Mark read immediately
              if (incomingMsg.receiverId === user.id) {
                chatService.markMessageAsRead(convId).catch(() => {});
              }
            }

            // Update conversation list preview and order
            setConversations((prevConvs) => {
              const existingIndex = prevConvs.findIndex((c) => c.id === convId);
              if (existingIndex !== -1) {
                const targetConv = { ...prevConvs[existingIndex] };
                targetConv.lastMessage = incomingMsg;
                if ((!currentActive || currentActive.id !== convId) && incomingMsg.receiverId === user.id) {
                  targetConv.unreadCount = (targetConv.unreadCount || 0) + 1;
                }
                const remaining = prevConvs.filter((_, idx) => idx !== existingIndex);
                return [targetConv, ...remaining];
              }
              // If not found, smoothly fetch in background without spinner
              fetchConversations(false);
              return prevConvs;
            });
          } catch (e) {
            console.error('Error handling user message notification:', e);
          }
        });

        // 4. Subscribe to Read receipts
        client.subscribe(`/topic/users/${user.id}/read`, (stompMessage) => {
          try {
            const readEvent = JSON.parse(stompMessage.body);
            if (!readEvent || !readEvent.conversationId) return;

            if (activeConversationRef.current?.id === readEvent.conversationId) {
              setMessages((prev) =>
                prev.map((m) => (m.senderId === user.id ? { ...m, read: true } : m))
              );
            }

            setConversations((prev) =>
              prev.map((c) =>
                c.id === readEvent.conversationId && c.lastMessage?.senderId === user.id
                  ? { ...c, lastMessage: { ...c.lastMessage, read: true } }
                  : c
              )
            );
          } catch (e) {
            console.error('Error handling read event:', e);
          }
        });

        // Subscribe to currently active conversation topic if active
        setupActiveConvSubscription(client);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      if (activeConvSubRef.current) {
        activeConvSubRef.current.unsubscribe();
        activeConvSubRef.current = null;
      }
      client.deactivate();
      stompClientRef.current = null;
    };
  }, [user?.id, decryptSingleMessage, fetchConversations, updateCurrentUser, setupActiveConvSubscription]);

  useEffect(() => {
    if (stompClientRef.current?.connected) {
      setupActiveConvSubscription(stompClientRef.current);
    }
  }, [activeConversation?.id, setupActiveConvSubscription]);

  // Debounced User Search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await userService.searchUsers(q);
        setSearchResults((results || []).filter((u) => u.id !== user?.id));
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    setMobileView('chat');
  };

  const startConversationWithUser = async (targetUser) => {
    try {
      const conv = await chatService.getOrCreateConversation(targetUser);
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        if (exists) return prev;
        return [conv, ...prev];
      });
      setActiveConversation(conv);
      setSearchQuery('');
      setSearchResults([]);
      setMobileView('chat');
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  /**
   * Encrypt message locally, then send only ciphertext to backend.
   */
  const handleSendMessage = async (content) => {
    if (!activeConversation || !user || !content.trim()) return;

    setIsSending(true);
    setE2eeError(null);
    try {
      let encryptedPayload = null;

      if (!USE_MOCK) {
        let peerPublicKey = activeConversation?.participant?.publicKey || null;
        if (!peerPublicKey && activeConversation?.participant?.id) {
          try {
            const freshPeer = await userService.getUserById(activeConversation.participant.id);
            if (freshPeer?.publicKey) {
              peerPublicKey = freshPeer.publicKey;
              setActiveConversation((prev) =>
                prev ? { ...prev, participant: { ...prev.participant, publicKey: peerPublicKey } } : prev
              );
            }
          } catch (fetchErr) {
            console.warn('Could not fetch peer public key for sending:', fetchErr);
          }
        }

        if (!peerPublicKey) {
          setE2eeError('Recipient has no E2EE public key registered yet. They must log in or activate E2EE.');
          return;
        }

        const myPrivKey = await getMyPrivateKey();
        if (!myPrivKey) {
          setE2eeError('Could not access your E2EE private key. Please refresh the page and try again.');
          return;
        }

        const aesKey = await getConversationKey(
          user.id,
          myPrivKey,
          activeConversation.participant.id,
          peerPublicKey
        );
        encryptedPayload = await encryptMessage(content, aesKey);
      } else {
        encryptedPayload = {
          ciphertext: btoa(content),
          nonce: btoa('mock-nonce-' + Date.now()),
          algorithm: 'AES-256-GCM',
          encryptionVersion: 1,
        };
      }

      const result = await chatService.sendMessage(
        activeConversation.id,
        activeConversation.participant.id,
        encryptedPayload
      );

      const sentMsg = result?.newMessage || (result?.id ? result : null);
      if (sentMsg) {
        processedMessageIds.current.add(sentMsg.id);
        const displayMsg = { ...sentMsg, content, isDecrypted: true };
        setMessages((prev) => {
          if (prev.some((m) => m.id === displayMsg.id)) return prev;
          return [...prev, displayMsg];
        });

        // Smooth local conversation preview update (no HTTP request, no spinner)
        setConversations((prevConvs) => {
          const targetIdx = prevConvs.findIndex((c) => c.id === activeConversation.id);
          if (targetIdx !== -1) {
            const updated = { ...prevConvs[targetIdx], lastMessage: sentMsg };
            const remaining = prevConvs.filter((_, idx) => idx !== targetIdx);
            return [updated, ...remaining];
          }
          return prevConvs;
        });
      }

      if (result?.updatedConversations) {
        setConversations(result.updatedConversations);
        const currentActive = result.updatedConversations.find((c) => c.id === activeConversation.id);
        if (currentActive) {
          setActiveConversation(currentActive);
        }
      }
    } catch (err) {
      console.error('Failed to send encrypted message:', err);
      setE2eeError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const updated = await userService.updateProfile(profileData);
      updateCurrentUser(updated);
      return updated;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to update profile');
    }
  };

  const handleUpdatePassword = async (passwordData) => {
    try {
      return await userService.updatePassword(passwordData);
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to update password');
    }
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    e2eeError,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    mobileView,
    setMobileView,
    selectConversation,
    startConversationWithUser,
    sendMessage: handleSendMessage,
    refreshConversations: fetchConversations,
    updateProfile: handleUpdateProfile,
    updatePassword: handleUpdatePassword,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

function logWebSocket(...args) {
  if (import.meta.env.DEV) {
    console.log('[WebSocket]', ...args);
  }
}

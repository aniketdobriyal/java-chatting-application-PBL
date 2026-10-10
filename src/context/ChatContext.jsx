import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { useAuth } from '../hooks/useAuth';

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  
  const [mobileView, setMobileView] = useState('list');


  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      const data = await chatService.getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, fetchConversations]);

  
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const data = await chatService.getMessages(activeConversation.id);
        setMessages(data || []);

     
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
  }, [activeConversation]);


  useEffect(() => {
    const isMock = import.meta.env.VITE_USE_MOCK !== 'false';
    if (isMock || !activeConversation) return;

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const wsUrl = apiBase
      .replace('/api', '/ws')
      .replace(/^http:\/\//, 'ws://')
      .replace(/^https:\/\//, 'wss://');

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/conversations/${activeConversation.id}`, (stompMessage) => {
          try {
            const incomingMsg = JSON.parse(stompMessage.body);
            if (incomingMsg && incomingMsg.id) {
              setMessages((prev) => {
                
                if (prev.some((m) => m.id === incomingMsg.id)) return prev;
                return [...prev, incomingMsg];
              });

             
              setConversations((prevConvs) =>
                prevConvs.map((c) =>
                  c.id === activeConversation.id
                    ? { ...c, lastMessage: incomingMsg }
                    : c
                )
              );
            }
          } catch (e) {
            console.error('STOMP payload parsing error:', e);
          }
        });
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [activeConversation]);

  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await userService.searchUsers(searchQuery);
       
        setSearchResults(results.filter((u) => u.id !== user?.id));
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  
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

  
  const handleSendMessage = async (content) => {
    if (!activeConversation || !user || !content.trim()) return;

    setIsSending(true);
    try {
      const result = await chatService.sendMessage(
        activeConversation.id,
        user.id,
        activeConversation.participant.id,
        content
      );

      const sentMsg = result?.newMessage || (result?.id ? result : null);
      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }

      if (result?.updatedConversations) {
        setConversations(result.updatedConversations);
        const currentActive = result.updatedConversations.find((c) => c.id === activeConversation.id);
        if (currentActive) {
          setActiveConversation(currentActive);
        }
      } else {
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

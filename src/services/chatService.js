import api from './api';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Local persistent mock storage initialization
const getStoredConversations = () => {
  const stored = localStorage.getItem('mock_conversations');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_e) {
      // Fallback
    }
  }
  localStorage.setItem('mock_conversations', JSON.stringify(INITIAL_CONVERSATIONS));
  return INITIAL_CONVERSATIONS;
};

const getStoredMessages = () => {
  const stored = localStorage.getItem('mock_messages');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_e) {
      // Fallback
    }
  }
  localStorage.setItem('mock_messages', JSON.stringify(INITIAL_MESSAGES));
  return INITIAL_MESSAGES;
};

export const chatService = {
  /**
   * Get user conversations
   * REST Endpoint: GET /api/conversations
   */
  getConversations: async () => {
    if (USE_MOCK) {
      await delay(300);
      return getStoredConversations();
    }

    const response = await api.get('/conversations');
    return response.data;
  },

  /**
   * Get existing or create new conversation with a target user
   * REST Endpoint: POST /api/conversations
   */
  getOrCreateConversation: async (targetUser) => {
    if (USE_MOCK) {
      await delay(300);
      const conversations = getStoredConversations();
      
      const existing = conversations.find((c) => c.participant?.id === targetUser.id);
      if (existing) {
        return existing;
      }

      const newConversation = {
        id: 'mock_conv_' + Date.now(),
        participant: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          avatar: targetUser.avatar,
          online: targetUser.online ?? true,
          statusMessage: targetUser.statusMessage || 'Available',
          publicKey: targetUser.publicKey || null,
        },
        lastMessage: null,
        unreadCount: 0,
      };

      const updatedConversations = [newConversation, ...conversations];
      localStorage.setItem('mock_conversations', JSON.stringify(updatedConversations));

      const messagesMap = getStoredMessages();
      messagesMap[newConversation.id] = [];
      localStorage.setItem('mock_messages', JSON.stringify(messagesMap));

      return newConversation;
    }

    const response = await api.post('/conversations', { recipientId: targetUser.id });
    return response.data;
  },

  /**
   * Get messages history for a conversation
   * REST Endpoint: GET /api/conversations/{conversationId}/messages?page=0&size=100
   */
  getMessages: async (conversationId, page = 0, size = 100) => {
    if (USE_MOCK) {
      await delay(250);
      const messagesMap = getStoredMessages();
      return messagesMap[conversationId] || [];
    }

    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Send an encrypted E2EE message
   * REST Endpoint: POST /api/conversations/{conversationId}/messages
   * Payload transmits ONLY ciphertext and encryption metadata.
   */
  sendMessage: async (conversationId, receiverId, encryptedPayload) => {
    if (USE_MOCK) {
      await delay(200);

      const newMessage = {
        id: 'mock_msg_' + Date.now(),
        conversationId,
        senderId: 'mock_self',
        receiverId,
        ciphertext: encryptedPayload.ciphertext,
        nonce: encryptedPayload.nonce,
        algorithm: encryptedPayload.algorithm || 'AES-256-GCM',
        encryptionVersion: encryptedPayload.encryptionVersion || 1,
        timestamp: new Date().toISOString(),
        read: true,
      };

      const messagesMap = getStoredMessages();
      const currentList = messagesMap[conversationId] || [];
      const updatedList = [...currentList, newMessage];
      messagesMap[conversationId] = updatedList;
      localStorage.setItem('mock_messages', JSON.stringify(messagesMap));

      const conversations = getStoredConversations();
      const updatedConversations = conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: newMessage,
          };
        }
        return c;
      });

      const targetIndex = updatedConversations.findIndex((c) => c.id === conversationId);
      if (targetIndex > 0) {
        const [targetConv] = updatedConversations.splice(targetIndex, 1);
        updatedConversations.unshift(targetConv);
      }

      localStorage.setItem('mock_conversations', JSON.stringify(updatedConversations));

      return { newMessage, updatedConversations };
    }

    const response = await api.post(`/conversations/${conversationId}/messages`, {
      ciphertext: encryptedPayload.ciphertext,
      nonce: encryptedPayload.nonce,
      algorithm: encryptedPayload.algorithm,
      encryptionVersion: encryptedPayload.encryptionVersion,
      receiverId,
    });
    return response.data;
  },

  /**
   * Mark messages as read in a conversation
   * REST Endpoint: PATCH /api/conversations/{conversationId}/read
   */
  markMessageAsRead: async (conversationId) => {
    if (USE_MOCK) {
      await delay(150);
      const conversations = getStoredConversations();
      const updatedConversations = conversations.map((c) => {
        if (c.id === conversationId) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      });
      localStorage.setItem('mock_conversations', JSON.stringify(updatedConversations));
      return updatedConversations;
    }

    const response = await api.patch(`/conversations/${conversationId}/read`);
    return response.data;
  },
};

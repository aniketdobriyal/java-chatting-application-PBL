/**
 * Realistic Mock Database for Standalone Frontend Development.
 * Structure maps directly to future Java Spring Boot REST DTOs.
 */

export const MOCK_CURRENT_USER = {
  id: 1,
  name: "Aniket Dobriyal",
  email: "aniket@example.com",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
  online: true,
  statusMessage: "Senior React & Spring Boot Engineer"
};

export const MOCK_USERS = [
  {
    id: 2,
    name: "Ashutosh Sharma",
    email: "ashutosh@example.com",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
    online: true,
    statusMessage: "Building microservices architecture"
  },
  {
    id: 3,
    name: "Ankit Verma",
    email: "ankit@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    online: false,
    statusMessage: "Busy in a meeting"
  },
  {
    id: 4,
    name: "Abhijit Roy",
    email: "abhijit@example.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    online: true,
    statusMessage: "Coding non-stop 🚀"
  },
  {
    id: 5,
    name: "Priya Singh",
    email: "priya@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    online: false,
    statusMessage: "Out for coffee ☕"
  }
];

export const INITIAL_CONVERSATIONS = [
  {
    id: 101,
    participant: {
      id: 2,
      name: "Ashutosh Sharma",
      email: "ashutosh@example.com",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
      online: true,
      statusMessage: "Building microservices architecture"
    },
    lastMessage: {
      id: 1005,
      conversationId: 101,
      senderId: 2,
      receiverId: 1,
      content: "Great! Let's connect the Spring Boot JWT endpoints tomorrow.",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      read: false
    },
    unreadCount: 2
  },
  {
    id: 102,
    participant: {
      id: 3,
      name: "Ankit Verma",
      email: "ankit@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      online: false,
      statusMessage: "Busy in a meeting"
    },
    lastMessage: {
      id: 1010,
      conversationId: 102,
      senderId: 1,
      receiverId: 3,
      content: "I have updated the Tailwind UI components for chat bubbles.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      read: true
    },
    unreadCount: 0
  },
  {
    id: 103,
    participant: {
      id: 4,
      name: "Abhijit Roy",
      email: "abhijit@example.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      online: true,
      statusMessage: "Coding non-stop 🚀"
    },
    lastMessage: {
      id: 1015,
      conversationId: 103,
      senderId: 4,
      receiverId: 1,
      content: "Did you review the Axios interceptor setup?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true
    },
    unreadCount: 0
  },
  {
    id: 104,
    participant: {
      id: 5,
      name: "Priya Singh",
      email: "priya@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      online: false,
      statusMessage: "Out for coffee ☕"
    },
    lastMessage: {
      id: 1020,
      conversationId: 104,
      senderId: 5,
      receiverId: 1,
      content: "Thanks Aniket! The mobile responsive view looks super clean.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      read: true
    },
    unreadCount: 0
  }
];

export const INITIAL_MESSAGES = {
  101: [
    {
      id: 1001,
      conversationId: 101,
      senderId: 1,
      receiverId: 2,
      content: "Hey Ashutosh! I've completed the React Chat frontend layout.",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: true
    },
    {
      id: 1002,
      conversationId: 101,
      senderId: 2,
      receiverId: 1,
      content: "Awesome! Did you separate the Axios service layer for our REST API?",
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      read: true
    },
    {
      id: 1003,
      conversationId: 101,
      senderId: 1,
      receiverId: 2,
      content: "Yes! AuthContext and ChatContext use authService and chatService with clean mock fallback.",
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      read: true
    },
    {
      id: 1004,
      conversationId: 101,
      senderId: 2,
      receiverId: 1,
      content: "That makes Spring Boot backend integration completely plug-and-play.",
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      read: false
    },
    {
      id: 1005,
      conversationId: 101,
      senderId: 2,
      receiverId: 1,
      content: "Great! Let's connect the Spring Boot JWT endpoints tomorrow.",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      read: false
    }
  ],
  102: [
    {
      id: 1008,
      conversationId: 102,
      senderId: 3,
      receiverId: 1,
      content: "Hi Aniket, how is the responsive layout coming along?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      read: true
    },
    {
      id: 1009,
      conversationId: 102,
      senderId: 1,
      receiverId: 3,
      content: "It supports both desktop split-screen and mobile drawer transition with back button.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      read: true
    },
    {
      id: 1010,
      conversationId: 102,
      senderId: 1,
      receiverId: 3,
      content: "I have updated the Tailwind UI components for chat bubbles.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      read: true
    }
  ],
  103: [
    {
      id: 1014,
      conversationId: 103,
      senderId: 1,
      receiverId: 4,
      content: "Hey Abhijit, I added complete input validation and Enter-to-send support.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
      read: true
    },
    {
      id: 1015,
      conversationId: 103,
      senderId: 4,
      receiverId: 1,
      content: "Did you review the Axios interceptor setup?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true
    }
  ],
  104: [
    {
      id: 1019,
      conversationId: 104,
      senderId: 1,
      receiverId: 5,
      content: "Hi Priya! Check out the new portfolio chat app.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      read: true
    },
    {
      id: 1020,
      conversationId: 104,
      senderId: 5,
      receiverId: 1,
      content: "Thanks Aniket! The mobile responsive view looks super clean.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      read: true
    }
  ]
};

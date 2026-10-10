import api from './api';
import { MOCK_CURRENT_USER } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * Helper to simulate network latency for mock calls
 */
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Login user
   * REST Endpoint: POST /api/auth/login
   */
  login: async (email, password) => {
    if (USE_MOCK) {
      await delay(600);
      
      // Development credentials check
      const normalizedEmail = email.toLowerCase().trim();
      
      if (normalizedEmail === 'aniket@example.com' && password === 'password123') {
        const authData = {
          token: 'mock-jwt-token-aniket-123456',
          user: MOCK_CURRENT_USER,
        };
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        return authData;
      }

      // Check if user was registered locally in mock mode
      const localUsers = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
      const foundUser = localUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        const authData = {
          token: `mock-jwt-token-${foundUser.id}-${Date.now()}`,
          user: userWithoutPassword,
        };
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        return authData;
      }

      throw new Error('Invalid email or password. (Default mock login: aniket@example.com / password123)');
    }

    // Spring Boot REST API
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Register user
   * REST Endpoint: POST /api/auth/register
   */
  register: async (name, email, password) => {
    if (USE_MOCK) {
      await delay(600);
      
      const normalizedEmail = email.toLowerCase().trim();
      
      if (normalizedEmail === 'aniket@example.com') {
        throw new Error('User with this email already exists.');
      }

      const localUsers = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
      if (localUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        throw new Error('User with this email already exists.');
      }

      const newUser = {
        id: Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        password,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        online: true,
        statusMessage: 'Hey there! I am using Chat App.',
      };

      localUsers.push(newUser);
      localStorage.setItem('mock_registered_users', JSON.stringify(localUsers));

      const { password: _, ...userWithoutPassword } = newUser;
      const authData = {
        token: `mock-jwt-token-${newUser.id}-${Date.now()}`,
        user: userWithoutPassword,
      };

      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      return authData;
    }

    // Spring Boot REST API
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current stored session user
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },
};

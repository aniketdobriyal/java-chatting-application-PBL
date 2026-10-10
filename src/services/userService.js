import api from './api';
import { MOCK_USERS } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const userService = {
  /**
   * Search registered users by name or email
   * REST Endpoint: GET /api/users/search?q={query}
   */
  searchUsers: async (query) => {
    if (USE_MOCK) {
      await delay(300);
      if (!query || !query.trim()) return [];
      const q = query.toLowerCase().trim();

      const localUsersStr = localStorage.getItem('mock_registered_users');
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
      const allUsers = [...MOCK_USERS, ...localUsers.map(({ password, ...u }) => u)];

      return allUsers.filter(
        (user) => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
      );
    }

    const response = await api.get('/users/search', { params: { q: query } });
    return response.data;
  },

  /**
   * Fetch all registered users
   * REST Endpoint: GET /api/users
   */
  getUsers: async () => {
    if (USE_MOCK) {
      await delay(300);
      const localUsersStr = localStorage.getItem('mock_registered_users');
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
      return [...MOCK_USERS, ...localUsers.map(({ password, ...u }) => u)];
    }

    const response = await api.get('/users');
    return response.data;
  },
};

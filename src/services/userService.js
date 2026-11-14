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
      const allUsers = [...MOCK_USERS, ...localUsers.map((u) => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      })];

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
      return [...MOCK_USERS, ...localUsers.map((u) => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      })];
    }

    const response = await api.get('/users');
    return response.data;
  },

  /**
   * Get user profile by ID (including public key)
   * REST Endpoint: GET /api/users/{userId}
   */
  getUserById: async (userId) => {
    if (USE_MOCK) {
      await delay(150);
      const allUsers = await userService.getUsers();
      return allUsers.find((u) => u.id === userId) || null;
    }

    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get current authenticated user profile
   * REST Endpoint: GET /api/users/me
   */
  getProfile: async () => {
    if (USE_MOCK) {
      await delay(200);
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }

    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Update current user profile (name, avatar, statusMessage, online)
   * REST Endpoint: PUT /api/users/me/profile
   */
  updateProfile: async ({ name, avatar, statusMessage, online }) => {
    if (USE_MOCK) {
      await delay(350);
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : {};
      const updatedUser = {
        ...currentUser,
        ...(name ? { name: name.trim() } : {}),
        ...(avatar ? { avatar: avatar.trim() } : {}),
        ...(statusMessage !== undefined ? { statusMessage: statusMessage.trim() } : {}),
        ...(online !== undefined ? { online } : {}),
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Also update in mock_registered_users if present
      const localUsersStr = localStorage.getItem('mock_registered_users');
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        const idx = localUsers.findIndex((u) => u.id === currentUser.id || u.email === currentUser.email);
        if (idx !== -1) {
          localUsers[idx] = { ...localUsers[idx], ...updatedUser };
          localStorage.setItem('mock_registered_users', JSON.stringify(localUsers));
        }
      }

      // Trigger mock event so listeners update in mock mode
      window.dispatchEvent(new CustomEvent('mock_profile_update', { detail: updatedUser }));
      if (online !== undefined) {
        window.dispatchEvent(
          new CustomEvent('mock_presence_update', {
            detail: { userId: updatedUser.id, online, statusMessage: updatedUser.statusMessage },
          })
        );
      }

      return updatedUser;
    }

    const response = await api.put('/users/me/profile', {
      name,
      avatar,
      statusMessage,
      online,
    });
    return response.data;
  },

  /**
   * Update password
   * REST Endpoint: PUT /api/users/me/password
   */
  updatePassword: async ({ currentPassword, newPassword }) => {
    if (USE_MOCK) {
      await delay(300);
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
      }
      return { success: true, message: 'Password updated successfully (mock mode).' };
    }

    const response = await api.put('/users/me/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Update online status / presence directly
   * REST Endpoint: PUT /api/users/me/status
   */
  updateStatus: async ({ online, statusMessage }) => {
    if (USE_MOCK) {
      await delay(200);
      return userService.updateProfile({ online, statusMessage });
    }

    const response = await api.put('/users/me/status', {
      online,
      statusMessage,
    });
    return response.data;
  },
};

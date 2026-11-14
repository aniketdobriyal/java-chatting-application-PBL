import api from './api';
import { MOCK_CURRENT_USER } from '../utils/mockData';
import { getOrGenerateUserKeypair, exportPublicKeySpki, saveUserKeypair, clearKeyCache } from '../utils/crypto';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Login user
   * REST Endpoint: POST /api/auth/login
   */
  login: async (email, password) => {
    if (USE_MOCK) {
      await delay(600);
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

      throw new Error('Invalid email or password.');
    }

    // Spring Boot REST API
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Ensure local E2EE keypair is generated and public key registered
      try {
        const keyPair = await getOrGenerateUserKeypair(response.data.user.id);
        const publicKeySpki = await exportPublicKeySpki(keyPair.publicKey);
        if (!response.data.user.publicKey || response.data.user.publicKey !== publicKeySpki) {
          const updateRes = await api.put('/users/me/public-key', { publicKey: publicKeySpki });
          if (updateRes.data) {
            response.data.user = updateRes.data;
            localStorage.setItem('user', JSON.stringify(updateRes.data));
          }
        }
      } catch (cryptoErr) {
        console.warn('E2EE key synchronization warning:', cryptoErr.message);
      }
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
        throw new Error('An account with this email address already exists.');
      }

      const localUsers = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
      if (localUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        throw new Error('An account with this email address already exists.');
      }

      const newUser = {
        id: 'mock_user_' + Date.now(),
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

    // Generate local E2EE keypair before registering
    let keyPair = null;
    let publicKeySpki = null;
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        keyPair = await window.crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );
        publicKeySpki = await exportPublicKeySpki(keyPair.publicKey);
      }
    } catch (e) {
      console.warn('Initial key generation error:', e);
    }

    // Spring Boot REST API
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      publicKey: publicKeySpki,
    });

    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Save the EXACT SAME keypair under the real user ID in IndexedDB!
      try {
        if (keyPair) {
          await saveUserKeypair(response.data.user.id, keyPair);
        } else {
          const generated = await getOrGenerateUserKeypair(response.data.user.id);
          const actualSpki = await exportPublicKeySpki(generated.publicKey);
          const updateRes = await api.put('/users/me/public-key', { publicKey: actualSpki });
          if (updateRes.data) {
            response.data.user = updateRes.data;
            localStorage.setItem('user', JSON.stringify(updateRes.data));
          }
        }
      } catch (err) {
        console.warn('Key setup post-registration error:', err);
      }
    }
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      if (!USE_MOCK) {
        await api.post('/auth/logout').catch(() => {});
      }
    } catch (_e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      clearKeyCache();
    }
  },

  /**
   * Get current stored session user
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (_e) {
      return null;
    }
  },
};

'use client';

import { create } from 'zustand';
import { api, User, AuthResponse } from './api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    organizationId: string;
    teamId?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => {
  // Initialize from localStorage
  const savedAccessToken =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const savedRefreshToken =
    typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  if (savedAccessToken) {
    api.setToken(savedAccessToken);
  }

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedAccessToken,
    refreshToken: savedRefreshToken,
    isAuthenticated: !!savedAccessToken && !!savedUser,
    isLoading: false,

    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        const response: AuthResponse = await api.login(email, password);

        // Save to localStorage
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));

        api.setToken(response.accessToken);

        set({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    register: async (data) => {
      set({ isLoading: true });
      try {
        const response: AuthResponse = await api.register(data);

        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));

        api.setToken(response.accessToken);

        set({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      api.clearToken();

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    refreshAuth: async () => {
      const { refreshToken } = get();
      if (!refreshToken) {
        get().logout();
        return;
      }

      try {
        const response: AuthResponse = await api.refreshToken(refreshToken);

        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));

        api.setToken(response.accessToken);

        set({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
        });
      } catch (error) {
        get().logout();
      }
    },
  };
});

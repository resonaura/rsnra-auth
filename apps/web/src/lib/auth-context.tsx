/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';

import { apiFetch } from '@/lib/api';
import { authenticateWithPasskey } from '@/lib/passkey-api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: {
    displayName?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(response.user);
  }, []);

  const register = React.useCallback(
    async (email: string, password: string, displayName?: string) => {
      const response = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      });
      setUser(response.user);
    },
    []
  );

  const loginWithPasskey = React.useCallback(async () => {
    const result = await authenticateWithPasskey();
    setUser(result.user);
  }, []);

  const logout = React.useCallback(async () => {
    await apiFetch<void>('/auth/logout', { method: 'POST' }).catch(() => null);
    setUser(null);
  }, []);

  const updateProfile = React.useCallback(
    async (input: { displayName?: string; avatarUrl?: string }) => {
      const updated = await apiFetch<AuthUser>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      setUser(updated);
    },
    []
  );

  const uploadAvatar = React.useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:2998';
    const response = await fetch(`${API_URL}/v1/auth/me/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body && typeof body === 'object' && 'message' in body
          ? String((body as { message: unknown }).message)
          : `Upload failed with status ${response.status}`;
      throw new Error(message);
    }
    const updated = (await response.json()) as AuthUser;
    setUser(updated);
  }, []);

  const deleteAccount = React.useCallback(async () => {
    await apiFetch<void>('/auth/me', { method: 'DELETE' });
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      loginWithPasskey,
      logout,
      updateProfile,
      uploadAvatar,
      deleteAccount,
    }),
    [
      user,
      isLoading,
      login,
      register,
      loginWithPasskey,
      logout,
      updateProfile,
      uploadAvatar,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

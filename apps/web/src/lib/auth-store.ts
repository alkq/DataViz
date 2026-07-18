import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  sub: string;
  email: string;
  tenant_id: string;
  role: string;
  session_id: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (accessToken: string, user: User) => set({ accessToken, user, isAuthenticated: true }),
      logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
      updateToken: (accessToken: string) => set({ accessToken }),
    }),
    { name: 'auth-storage' }
  )
);
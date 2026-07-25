import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  expiresAt: number | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setHydrated: () => void;
  login: (token: string, user: User, expiresIn?: number) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  refreshToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      expiresAt: null,
      isAuthenticated: false,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      login: (accessToken: string, user: User, expiresIn?: number) =>
        set({
          accessToken,
          user,
          isAuthenticated: true,
          expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
        }),
      logout: () => set({ accessToken: null, user: null, isAuthenticated: false, expiresAt: null }),
      updateToken: (accessToken: string) => set({ accessToken }),
      refreshToken: (accessToken: string) =>
        set({ accessToken, expiresAt: Date.now() + 3600 * 1000 }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Called after localStorage has been read; mark hydrated so guards
        // don't redirect based on the default (unauthenticated) state.
        state?.setHydrated();
      },
    }
  )
);

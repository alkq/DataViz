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
  isAuthenticated: boolean;
  hydrated: boolean;
  setHydrated: () => void;
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
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      login: (accessToken: string, user: User) => set({ accessToken, user, isAuthenticated: true }),
      logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
      updateToken: (accessToken: string) => set({ accessToken }),
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

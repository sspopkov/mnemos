import { create } from 'zustand';

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type SetAuthPayload = {
  user: AuthUser;
  accessToken: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  initialized: boolean;
  setAuth: (payload: SetAuthPayload) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  initialized: false,
  setAuth: ({ user, accessToken }) =>
    set({
      user,
      accessToken,
      initialized: true,
    }),
  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      initialized: true,
    }),
}));

export const selectAuthUser = (state: AuthState) => state.user;
export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectAuthInitialized = (state: AuthState) => state.initialized;

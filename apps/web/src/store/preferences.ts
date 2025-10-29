import type { PaletteMode } from '@mui/material';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

type PreferencesSnapshot = {
  themeMode: PaletteMode;
};

type UserPreferencesState = PreferencesSnapshot & {
  isHydrated: boolean;
  setThemeMode: (mode: PaletteMode) => void;
  toggleThemeMode: () => void;
  applyPreferences: (preferences: Partial<PreferencesSnapshot>) => void;
  markHydrated: () => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const getPreferredThemeMode = (): PaletteMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      themeMode: getPreferredThemeMode(),
      isHydrated: false,
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleThemeMode: () => {
        const { themeMode } = get();
        set({ themeMode: themeMode === 'light' ? 'dark' : 'light' });
      },
      applyPreferences: (preferences) => set(preferences),
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'mnemos.user-preferences',
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return noopStorage;
        }

        return window.localStorage;
      }),
      partialize: (state) => ({
        themeMode: state.themeMode,
      }),
      onRehydrateStorage: () => (state, error) => {
        state?.markHydrated();
        if (error) {
          // eslint-disable-next-line no-console
          console.warn('Rehydrate failed', error);
        }
      },
    },
  ),
);

export const selectThemeMode = (state: UserPreferencesState) => state.themeMode;
export const selectToggleThemeMode = (state: UserPreferencesState) => state.toggleThemeMode;
export const selectApplyPreferences = (state: UserPreferencesState) => state.applyPreferences;
export const selectPreferencesHydrated = (state: UserPreferencesState) => state.isHydrated;

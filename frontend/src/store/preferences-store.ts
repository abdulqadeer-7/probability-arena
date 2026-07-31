import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  theme: 'light' | 'dark';
  language: 'en' | 'ur';
  soundEnabled: boolean;
  reducedMotion: boolean;
  lowPerformanceMode: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLanguage: (language: 'en' | 'ur') => void;
  toggleSound: () => void;
  toggleReducedMotion: () => void;
  toggleLowPerformanceMode: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      language: 'en',
      soundEnabled: true,
      reducedMotion: false,
      lowPerformanceMode: false,

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        }
      },

      setLanguage: (language) => {
        set({ language });
        if (typeof document !== 'undefined') {
          document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
          document.documentElement.lang = language;
        }
      },

      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
      toggleReducedMotion: () => set({ reducedMotion: !get().reducedMotion }),
      toggleLowPerformanceMode: () => set({ lowPerformanceMode: !get().lowPerformanceMode }),
    }),
    {
      name: 'aero-preferences',
    }
  )
);

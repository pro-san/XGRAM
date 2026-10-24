import { create } from 'zustand';
import type { ThemeMode, Language } from '../types';

interface UIState {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),
  themeMode: (localStorage.getItem('themeMode') as ThemeMode) || 'light',
  toggleTheme: () => {
    const next = get().themeMode === 'light' ? 'dark' : 'light';
    localStorage.setItem('themeMode', next);
    set({ themeMode: next });
  },
  language: (localStorage.getItem('language') as Language) || 'en',
  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },
}));

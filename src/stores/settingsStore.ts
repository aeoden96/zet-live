import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MapTileProvider = 'osm' | 'positron' | 'dark-matter';
export type Theme = 'light' | 'dark';

interface SettingsState {
  sandboxVisible: boolean;
  mapTileProvider: MapTileProvider;
  theme: Theme;
  onboardingCompleted: boolean;
  setSandboxVisible: (visible: boolean) => void;
  setMapTileProvider: (provider: MapTileProvider) => void;
  setTheme: (theme: Theme) => void;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sandboxVisible: true,
      mapTileProvider: 'osm',
      theme: (localStorage.getItem('theme') as Theme) || 'light',
      onboardingCompleted: false,
      setSandboxVisible: (visible) => set({ sandboxVisible: visible }),
      setMapTileProvider: (provider) => set({ mapTileProvider: provider }),
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      },
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
    }),
    {
      name: 'zet-live-settings',
    }
  )
);

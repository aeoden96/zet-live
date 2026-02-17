import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MapTileProvider = 'osm' | 'positron' | 'dark-matter';
export type Theme = 'light' | 'dark';
/** 'individual' – show only platform stops with zoom-based opacity (default)
 *  'grouped'   – classic grouped parents / parent-station / platform view */
export type StopDisplayMode = 'individual' | 'grouped';

interface SettingsState {
  sandboxVisible: boolean;
  mapTileProvider: MapTileProvider;
  theme: Theme;
  onboardingCompleted: boolean;
  stopDisplayMode: StopDisplayMode;
  setSandboxVisible: (visible: boolean) => void;
  setMapTileProvider: (provider: MapTileProvider) => void;
  setTheme: (theme: Theme) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setStopDisplayMode: (mode: StopDisplayMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sandboxVisible: true,
      mapTileProvider: 'osm',
      theme: (localStorage.getItem('theme') as Theme) || 'light',
      onboardingCompleted: false,
      stopDisplayMode: 'individual',
      setSandboxVisible: (visible) => set({ sandboxVisible: visible }),
      setMapTileProvider: (provider) => set({ mapTileProvider: provider }),
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      },
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      setStopDisplayMode: (mode) => set({ stopDisplayMode: mode }),
    }),
    {
      name: 'zet-live-settings',
    }
  )
);

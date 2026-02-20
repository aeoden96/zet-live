import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MapTileProvider = 'osm' | 'positron' | 'dark-matter';
export type Theme = 'light' | 'dark';
/** 'individual' – show only platform stops with zoom-based opacity (default)
 *  'grouped'   – classic grouped parents / parent-station / platform view */
export type StopDisplayMode = 'individual' | 'grouped';
export type AppMode = 'map' | 'list';

export interface RecentItem {
  id: string;
  timestamp: number;
}

const MAX_RECENTS = 10;

interface SettingsState {
  sandboxVisible: boolean;
  mapTileProvider: MapTileProvider;
  theme: Theme;
  onboardingCompleted: boolean;
  stopDisplayMode: StopDisplayMode;
  showAllVehicles: boolean;
  appMode: AppMode;
  /** Favourite route IDs */
  favouriteRouteIds: string[];
  /** Favourite stop IDs */
  favouriteStopIds: string[];
  /** Recently viewed routes (newest first, max 10) */
  recentRoutes: RecentItem[];
  /** Recently viewed stops (newest first, max 10) */
  recentStops: RecentItem[];

  setSandboxVisible: (visible: boolean) => void;
  setMapTileProvider: (provider: MapTileProvider) => void;
  setTheme: (theme: Theme) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setStopDisplayMode: (mode: StopDisplayMode) => void;
  setShowAllVehicles: (show: boolean) => void;
  setAppMode: (mode: AppMode) => void;
  toggleFavouriteRoute: (id: string) => void;
  toggleFavouriteStop: (id: string) => void;
  addRecentRoute: (id: string) => void;
  addRecentStop: (id: string) => void;
  clearRecents: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sandboxVisible: true,
      mapTileProvider: 'osm',
      theme: (localStorage.getItem('theme') as Theme) || 'light',
      onboardingCompleted: false,
      stopDisplayMode: 'individual',
      showAllVehicles: true,
      appMode: 'map',
      favouriteRouteIds: [],
      favouriteStopIds: [],
      recentRoutes: [],
      recentStops: [],

      setSandboxVisible: (visible) => set({ sandboxVisible: visible }),
      setMapTileProvider: (provider) => set({ mapTileProvider: provider }),
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      },
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      setStopDisplayMode: (mode) => set({ stopDisplayMode: mode }),
      setShowAllVehicles: (show) => set({ showAllVehicles: show }),
      setAppMode: (mode) => set({ appMode: mode }),

      toggleFavouriteRoute: (id) =>
        set((s) => ({
          favouriteRouteIds: s.favouriteRouteIds.includes(id)
            ? s.favouriteRouteIds.filter((r) => r !== id)
            : [...s.favouriteRouteIds, id],
        })),

      toggleFavouriteStop: (id) =>
        set((s) => ({
          favouriteStopIds: s.favouriteStopIds.includes(id)
            ? s.favouriteStopIds.filter((r) => r !== id)
            : [...s.favouriteStopIds, id],
        })),

      addRecentRoute: (id) =>
        set((s) => {
          const filtered = s.recentRoutes.filter((r) => r.id !== id);
          return {
            recentRoutes: [{ id, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENTS),
          };
        }),

      addRecentStop: (id) =>
        set((s) => {
          const filtered = s.recentStops.filter((r) => r.id !== id);
          return {
            recentStops: [{ id, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENTS),
          };
        }),

      clearRecents: () => set({ recentRoutes: [], recentStops: [] }),
    }),
    {
      name: 'zet-live-settings',
    }
  )
);

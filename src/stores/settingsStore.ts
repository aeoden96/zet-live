import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MapTileProvider = 'osm' | 'positron' | 'dark-matter';
export type Theme = 'light' | 'dark';

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
  onboardingStep: number;

  showAllVehicles: boolean;
  /** Show Zagreb open-data road closures layer */
  showRoadClosures: boolean;
  showBikeStations: boolean;
  showBikeParkings: boolean;
  showBikePaths: boolean;
  /** Zagreb city data toggles */
  showStudentRestaurants: boolean;
  showPublicFountains: boolean;
  showPedestrianZones: boolean;
  showFreeWifi: boolean;
  /** Prefer more detailed map tiles (Standard / HOT) */
  detailedMap: boolean;
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
  setDetailedMap: (detailed: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setOnboardingStep: (step: number) => void;

  setShowAllVehicles: (show: boolean) => void;
  setShowRoadClosures: (show: boolean) => void;
  setShowBikeStations: (show: boolean) => void;
  setShowBikeParkings: (show: boolean) => void;
  setShowBikePaths: (show: boolean) => void;
  setShowStudentRestaurants: (show: boolean) => void;
  setShowPublicFountains: (show: boolean) => void;
  setShowPedestrianZones: (show: boolean) => void;
  setShowFreeWifi: (show: boolean) => void;
  setAppMode: (mode: AppMode) => void;
  toggleFavouriteRoute: (id: string) => void;
  toggleFavouriteStop: (id: string) => void;
  addRecentRoute: (id: string) => void;
  addRecentStop: (id: string) => void;
  clearRecents: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => {
      const initialTheme = (localStorage.getItem('theme') as Theme) || 'dark';
      // Ensure the document theme attribute matches the initial value
      try {
        document.documentElement.setAttribute('data-theme', initialTheme);
      } catch (_e) {
        // no-op (safe for environments without document)
        void _e;
      }

      return {
        sandboxVisible: false,
        mapTileProvider: initialTheme === 'dark' ? 'dark-matter' : 'osm',
        theme: initialTheme,
        detailedMap: true,
        onboardingCompleted: false,
        onboardingStep: 0,

        showAllVehicles: true,
        showRoadClosures: false,
        showBikeStations: true,
        showBikeParkings: true,
        showBikePaths: true,
        showStudentRestaurants: true,
        showPublicFountains: true,
        showPedestrianZones: true,
        showFreeWifi: true,
        appMode: 'map',
        favouriteRouteIds: [],
        favouriteStopIds: [],
        recentRoutes: [],
        recentStops: [],

        setSandboxVisible: (visible) => set({ sandboxVisible: visible }),
        setDetailedMap: (detailed) => set({ detailedMap: detailed }),
        setMapTileProvider: (provider) => {
          const themeForProvider: Theme = provider === 'dark-matter' ? 'dark' : 'light';
          set({ mapTileProvider: provider, theme: themeForProvider });
          try {
            document.documentElement.setAttribute('data-theme', themeForProvider);
          } catch (_e) {
            void _e;
          }
          localStorage.setItem('theme', themeForProvider);
        },
        setTheme: (theme) => {
          const providerForTheme: MapTileProvider = theme === 'dark' ? 'dark-matter' : 'osm';
          set({ theme, mapTileProvider: providerForTheme });
          try {
            document.documentElement.setAttribute('data-theme', theme);
          } catch (_e) {
            void _e;
          }
          localStorage.setItem('theme', theme);
        },
        setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
        setOnboardingStep: (step) => set({ onboardingStep: step }),

        setShowAllVehicles: (show) => set({ showAllVehicles: show }),
        setShowRoadClosures: (show) => set({ showRoadClosures: show }),
        setShowBikeStations: (show) => set({ showBikeStations: show }),
        setShowBikeParkings: (show) => set({ showBikeParkings: show }),
        setShowBikePaths: (show) => set({ showBikePaths: show }),
        setShowStudentRestaurants: (show) => set({ showStudentRestaurants: show }),
        setShowPublicFountains: (show) => set({ showPublicFountains: show }),
        setShowPedestrianZones: (show) => set({ showPedestrianZones: show }),
        setShowFreeWifi: (show) => set({ showFreeWifi: show }),
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
      };
    },
    {
      name: 'zet-live-settings',
    }
  )
);

/**
 * GTFS mode configuration — a single typed object that describes all
 * mode-specific parameters so that no raw "data-train" / "data" strings
 * need to be scattered across hooks, components, or pages.
 */

export interface GTFSModeConfig {
  /** Unique identifier for the mode. */
  id: 'transit' | 'train';
  /** Public data directory served by Vite (e.g. 'data' → /data/…). */
  dataDir: 'data' | 'data-train';
  /** Whether to subscribe to the GTFS-RT realtime proxy. */
  hasRealtime: boolean;
  /** Map zoom level used when flying to a single stop. */
  stopZoom: number;
  /** Placeholder text shown in the search bar. */
  searchPlaceholder: string;
  /** Spinner label shown while the initial dataset is loading. */
  loadingText: string;
  /** Variant passed to <OnboardingWizard>. */
  onboardingVariant: 'transit' | 'train';
}

/** ZET bus / tram public transport (default mode). */
export const TRANSIT_MODE: GTFSModeConfig = {
  id: 'transit',
  dataDir: 'data',
  hasRealtime: true,
  stopZoom: 17,
  searchPlaceholder: 'Pretraži linije...',
  loadingText: 'Učitavanje podataka...',
  onboardingVariant: 'transit',
};

/** HŽ Passenger Transport regional / suburban trains. */
export const TRAIN_MODE: GTFSModeConfig = {
  id: 'train',
  dataDir: 'data-train',
  hasRealtime: false,
  stopZoom: 15,
  searchPlaceholder: 'Pretraži vlakove...',
  loadingText: 'Učitavanje podataka o vlakovima...',
  onboardingVariant: 'train',
};

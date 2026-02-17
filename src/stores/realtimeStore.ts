/**
 * Zustand store for GTFS Realtime data.
 * Not persisted — realtime data is ephemeral by nature.
 */

import { create } from 'zustand';
import {
  fetchRealtimeFeed,
  parseVehiclePositions,
  parseTripUpdates,
  getFeedStatistics,
  type ParsedVehiclePosition,
  type ParsedTripUpdate,
  type FeedStatistics,
} from '../utils/realtime';

interface RealtimeState {
  /** Vehicle positions keyed by tripId */
  vehiclePositions: Map<string, ParsedVehiclePosition>;
  /** Trip updates keyed by tripId */
  tripUpdates: Map<string, ParsedTripUpdate>;
  /** Feed statistics from the last successful fetch */
  stats: FeedStatistics | null;
  /** POSIX timestamp (ms) of the last successful fetch */
  lastUpdate: number | null;
  /** Whether a fetch is currently in progress */
  loading: boolean;
  /** Error from the last failed fetch, null if last fetch succeeded */
  error: Error | null;

  /** Fetch both vehicle-positions and trip-updates feeds in parallel */
  fetchAll: () => Promise<void>;
  /** Clear all realtime data */
  clear: () => void;
}

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  vehiclePositions: new Map(),
  tripUpdates: new Map(),
  stats: null,
  lastUpdate: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true });

    try {
      // The ZET feed is a single combined feed — both endpoints return the same
      // protobuf blob, so we can fetch once and parse both types from it.
      const feed = await fetchRealtimeFeed('vehicle-positions');

      const positions = parseVehiclePositions(feed);
      const updates = parseTripUpdates(feed);
      const stats = getFeedStatistics(feed);

      const vehiclePositions = new Map<string, ParsedVehiclePosition>();
      for (const pos of positions) {
        if (pos.tripId) {
          vehiclePositions.set(pos.tripId, pos);
        }
      }

      const tripUpdates = new Map<string, ParsedTripUpdate>();
      for (const update of updates) {
        if (update.tripId) {
          tripUpdates.set(update.tripId, update);
        }
      }

      set({
        vehiclePositions,
        tripUpdates,
        stats,
        lastUpdate: Date.now(),
        loading: false,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[RealtimeStore] Fetch failed:', error.message);
      set({ loading: false, error });
    }
  },

  clear: () => {
    set({
      vehiclePositions: new Map(),
      tripUpdates: new Map(),
      stats: null,
      lastUpdate: null,
      error: null,
    });
  },
}));

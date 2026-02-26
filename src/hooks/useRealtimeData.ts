/**
 * Hook that starts polling the GTFS Realtime proxy worker and populates
 * the realtimeStore. Call this once near the top of the component tree.
 */

import { useEffect } from 'react';
import { useRealtimeStore } from '../stores/realtimeStore';
import { REALTIME_POLL_INTERVAL } from '../config';

export function useRealtimeData(enabled: boolean = true) {
  const { fetchAll, vehiclePositions, tripUpdates, stats, lastUpdate, loading, error } =
    useRealtimeStore();

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchAll();

    // Poll on a fixed interval
    const id = setInterval(fetchAll, REALTIME_POLL_INTERVAL);

    return () => clearInterval(id);
    // fetchAll is stable (Zustand action) — no need in dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { vehiclePositions, tripUpdates, stats, lastUpdate, loading, error };
}

/**
 * Hook that starts polling the GTFS Realtime proxy worker and populates
 * the realtimeStore. Call this once near the top of the component tree.
 */

import { useEffect } from 'react';
import { useRealtimeStore } from '../stores/realtimeStore';
import { REALTIME_POLL_INTERVAL } from '../config';

export function useRealtimeData() {
  const { fetchAll, vehiclePositions, tripUpdates, stats, lastUpdate, loading, error } =
    useRealtimeStore();

  useEffect(() => {
    // Initial fetch
    fetchAll();

    // Poll on a fixed interval
    const id = setInterval(fetchAll, REALTIME_POLL_INTERVAL);

    return () => clearInterval(id);
    // fetchAll is stable (Zustand action) — no need in dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { vehiclePositions, tripUpdates, stats, lastUpdate, loading, error };
}

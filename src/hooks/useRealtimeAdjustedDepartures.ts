/**
 * Hook to enrich scheduled stop departures with realtime delay information.
 *
 * For each route serving a given stop, scans the live tripUpdates Map from
 * realtimeStore to find a matching stop-time update (by stopId + routeId).
 * Returns a per-route delay map so the departure boards can show adjusted times.
 */

import { useMemo } from 'react';
import type { StopDepartures } from '../utils/gtfs';
import { useRealtimeStore } from '../stores/realtimeStore';

export interface RealtimeDelayInfo {
  /** Delay in seconds. Positive = late, negative = early. */
  delaySeconds: number;
  /** Whether it was matched at the specific stop level (more accurate) or trip level. */
  source: 'stop' | 'trip';
}

/**
 * Returns a Map<routeId, RealtimeDelayInfo> for the given stop.
 *
 * The map only contains entries for routes that have realtime data.
 * Routes without any matching trip update are omitted (undefined = schedule-only).
 */
export function useRealtimeAdjustedDepartures(
  stopId: string | null,
  departures: StopDepartures | null
): Map<string, RealtimeDelayInfo> {
  const tripUpdates = useRealtimeStore((s) => s.tripUpdates);

  return useMemo(() => {
    const result = new Map<string, RealtimeDelayInfo>();

    if (!stopId || !departures) return result;

    // Build a lookup: routeId → list of tripUpdates for that route
    const byRoute = new Map<string, typeof tripUpdates extends Map<string, infer V> ? V[] : never[]>();
    for (const update of tripUpdates.values()) {
      if (!update.routeId) continue;
      const existing = byRoute.get(update.routeId);
      if (existing) {
        existing.push(update);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        byRoute.set(update.routeId, [update] as any);
      }
    }

    for (const routeId of departures.routes) {
      const updates = byRoute.get(routeId);
      if (!updates?.length) continue;

      // Try to find a stop-specific delay first (most accurate)
      let bestDelay: RealtimeDelayInfo | null = null;

      for (const update of updates) {
        const stu = update.stopTimeUpdates.find((s) => s.stopId === stopId);
        if (stu) {
          const delay = stu.departureDelay ?? stu.arrivalDelay;
          if (delay !== undefined) {
            // Prefer stop-level match; pick the trip closest to "now" (first found)
            if (!bestDelay || bestDelay.source === 'trip') {
              bestDelay = { delaySeconds: delay, source: 'stop' };
            }
          }
        } else if (!bestDelay) {
          // Fall back to trip-level delay
          if (update.delay !== undefined) {
            bestDelay = { delaySeconds: update.delay, source: 'trip' };
          }
        }
      }

      if (bestDelay) {
        result.set(routeId, bestDelay);
      }
    }

    return result;
  }, [stopId, departures, tripUpdates]);
}

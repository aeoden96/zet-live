/**
 * Hook for fetching stop departure data
 */

import { useState, useEffect, useRef } from 'react';
import type { StopDepartures } from '../utils/gtfs';
import { fetchStopDepartures } from '../utils/gtfs';

export function useStopDepartures(stopId: string | null) {
  const [data, setData] = useState<StopDepartures | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Cache loaded stops to avoid refetching
  const cache = useRef<Map<string, StopDepartures>>(new Map());

  useEffect(() => {
    if (!stopId) {
      setData(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = cache.current.get(stopId);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    fetchStopDepartures(stopId)
      .then((departures) => {
        if (mounted) {
          // Cache the data
          cache.current.set(stopId, departures);
          
          setData(departures);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [stopId]);

  return {
    departures: data,
    loading,
    error
  };
}

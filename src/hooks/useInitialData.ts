/**
 * Hook for fetching and caching initial GTFS data
 */

import { useState, useEffect, useMemo } from 'react';
import type { InitialData, Stop } from '../utils/gtfs';
import { fetchInitialData, isParentStation } from '../utils/gtfs';
import { checkCacheVersion } from '../stores/dataCache';

export function useInitialData() {
  const [data, setData] = useState<InitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check cache version first, then fetch data
    checkCacheVersion()
      .then(() => fetchInitialData())
      .then((initialData) => {
        if (mounted) {
          setData(initialData);
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
  }, []);

  // Filter parent stations for map display
  const parentStations = useMemo(() => {
    if (!data) return [];
    return data.stops.filter(isParentStation);
  }, [data]);

  // Create lookup maps
  const stopsById = useMemo(() => {
    if (!data) return new Map<string, Stop>();
    return new Map(data.stops.map(stop => [stop.id, stop]));
  }, [data]);

  const routesById = useMemo(() => {
    if (!data) return new Map();
    return new Map(data.routes.map(route => [route.id, route]));
  }, [data]);

  return {
    stops: data?.stops || [],
    routes: data?.routes || [],
    calendar: data?.calendar || {},
    parentStations,
    stopsById,
    routesById,
    feedVersion: data?.feedVersion,
    feedStartDate: data?.feedStartDate,
    feedEndDate: data?.feedEndDate,
    loading,
    error
  };
}

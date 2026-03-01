/**
 * Hook for fetching and caching initial GTFS data
 */

import { useState, useEffect, useMemo } from 'react';
import type { InitialData, Stop, ParentGroup } from '../utils/gtfs';
import { fetchInitialData, clusterParentStops } from '../utils/gtfs';
import { checkCacheVersion } from '../stores/dataCache';

interface UseInitialDataOptions {
  /** Data directory to load from (default: 'data'). Use 'data-train' for train mode. */
  dataDir?: string;
}

export function useInitialData(options: UseInitialDataOptions = {}) {
  const { dataDir = 'data' } = options;
  const [data, setData] = useState<InitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check cache version for this specific manifest, then fetch data
    checkCacheVersion(`${dataDir}/manifest.json`)
      .then(() => fetchInitialData(dataDir))
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
  }, [dataDir]);

  // Create lookup maps
  const stopsById = useMemo(() => {
    if (!data) return new Map<string, Stop>();
    return new Map(data.stops.map(stop => [stop.id, stop]));
  }, [data]);

  const routesById = useMemo(() => {
    if (!data) return new Map();
    return new Map(data.routes.map(route => [route.id, route]));
  }, [data]);

  const groupedParentStations: ParentGroup[] = useMemo(() => {
    if (!data) return [];
    // Prefer server-provided clusters (if processor wrote them), otherwise fallback to client clustering
    if ((data as InitialData).groupedParentStations && (data as any).groupedParentStations.length) {
      return (data as any).groupedParentStations as ParentGroup[];
    }

    const parents = data.stops.filter(s => s.locationType === 1);
    // default clustering radius: 150 meters (client-side fallback)
    return clusterParentStops(parents, 150);
  }, [data]);

  return {
    stops: data?.stops || [],
    routes: data?.routes || [],
    calendar: data?.calendar || {},
    stopsById,
    routesById,
    groupedParentStations,
    feedVersion: data?.feedVersion,
    feedStartDate: data?.feedStartDate,
    feedEndDate: data?.feedEndDate,
    loading,
    error
  };
}

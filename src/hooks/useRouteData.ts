/**
 * Hook for fetching route-specific data (shapes, stops, active trips)
 */

import { useState, useEffect, useRef } from 'react';
import type { RouteActiveTripsData } from '../utils/gtfs';
import { 
  fetchRouteShapes, 
  fetchRouteStops, 
  fetchRouteActiveTrips
} from '../utils/gtfs';

interface RouteData {
  shapes: Record<string, [number, number][]>;
  routeStops: string[];
  activeTripsData: RouteActiveTripsData | null;
}

export function useRouteData(routeId: string | null) {
  const [data, setData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Cache loaded routes to avoid refetching
  const cache = useRef<Map<string, RouteData>>(new Map());

  useEffect(() => {
    if (!routeId) {
      setData(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = cache.current.get(routeId);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    // Fetch all route data in parallel
    Promise.all([
      fetchRouteShapes(routeId),
      fetchRouteStops(routeId),
      fetchRouteActiveTrips(routeId)
    ])
      .then(([shapes, stopsData, activeTripsData]) => {
        if (mounted) {
          const routeData: RouteData = {
            shapes,
            routeStops: stopsData.stops,
            activeTripsData
          };
          
          // Cache the data
          cache.current.set(routeId, routeData);
          
          setData(routeData);
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
  }, [routeId]);

  return {
    shapes: data?.shapes || {},
    routeStops: data?.routeStops || [],
    activeTripsData: data?.activeTripsData || null,
    loading,
    error
  };
}

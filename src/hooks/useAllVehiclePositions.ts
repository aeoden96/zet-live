/**
 * Hook for calculating and updating all vehicle positions across all routes
 */

import { useState, useEffect, useRef } from 'react';
import type { AllActiveTripsData } from '../utils/gtfs';
import type { AllVehiclePosition } from '../utils/vehicles';
import { fetchAllActiveTrips } from '../utils/gtfs';
import { getAllActiveVehicles } from '../utils/vehicles';
import { useCurrentTime } from './useCurrentTime';

const UPDATE_INTERVAL = 30000; // 30 seconds

export function useAllVehiclePositions(
  enabled: boolean,
  serviceId: string | null
) {
  const [vehicles, setVehicles] = useState<AllVehiclePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const currentTime = useCurrentTime();
  
  // Cache loaded data to avoid refetching
  const dataCache = useRef<AllActiveTripsData | null>(null);

  useEffect(() => {
    if (!enabled || !serviceId) {
      setVehicles([]);
      return;
    }

    // If data is already cached, just update positions
    if (dataCache.current) {
      const activeVehicles = getAllActiveVehicles(
        dataCache.current,
        currentTime,
        serviceId
      );
      setVehicles(activeVehicles);
      return;
    }

    // Fetch data for the first time
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchAllActiveTrips()
      .then((data) => {
        if (mounted) {
          dataCache.current = data;
          
          const activeVehicles = getAllActiveVehicles(
            data,
            currentTime,
            serviceId
          );
          setVehicles(activeVehicles);
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
  }, [enabled, serviceId, currentTime]);

  // Set up interval for periodic updates when enabled and data is cached
  useEffect(() => {
    if (!enabled || !serviceId || !dataCache.current) {
      return;
    }

    const updatePositions = () => {
      if (dataCache.current) {
        const activeVehicles = getAllActiveVehicles(
          dataCache.current,
          currentTime,
          serviceId
        );
        setVehicles(activeVehicles);
      }
    };

    const intervalId = setInterval(updatePositions, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [enabled, serviceId, currentTime]);

  return {
    vehicles,
    loading,
    error
  };
}

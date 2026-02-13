/**
 * Hook for calculating and updating vehicle positions
 */

import { useState, useEffect } from 'react';
import type { RouteActiveTripsData } from '../utils/gtfs';
import type { VehiclePosition } from '../utils/vehicles';
import { getActiveVehicles } from '../utils/vehicles';
import { useCurrentTime } from './useCurrentTime';

const UPDATE_INTERVAL = 30000; // 30 seconds

export function useVehiclePositions(
  activeTripsData: RouteActiveTripsData | null,
  serviceId: string | null
) {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const currentTime = useCurrentTime();

  useEffect(() => {
    if (!activeTripsData || !serviceId) {
      setVehicles([]);
      return;
    }

    // Update vehicle positions
    const updatePositions = () => {
      const activeVehicles = getActiveVehicles(
        activeTripsData.trips,
        activeTripsData.shapes,
        currentTime,
        serviceId
      );
      setVehicles(activeVehicles);
    };

    // Initial update
    updatePositions();

    // Set up interval for periodic updates
    const intervalId = setInterval(updatePositions, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [activeTripsData, serviceId, currentTime]);

  return vehicles;
}

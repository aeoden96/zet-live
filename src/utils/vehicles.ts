/**
 * Vehicle position interpolation utilities
 */

import type { ActiveTrip, AllActiveTripsData } from './gtfs';

export interface VehiclePosition {
  tripId: string;
  lat: number;
  lon: number;
  headsign: string;
  direction: number;
  progress: number; // 0-1 fractional progress along route
}

export interface AllVehiclePosition extends VehiclePosition {
  routeId: string;
  routeShortName: string;
  routeType: number; // 0 = Tram, 3 = Bus
}

/**
 * Interpolate position along a shape polyline based on progress (0-1)
 */
export function interpolatePosition(
  shape: [number, number][],
  progress: number
): [number, number] {
  if (shape.length === 0) {
    return [0, 0];
  }
  
  if (shape.length === 1 || progress <= 0) {
    return shape[0];
  }
  
  if (progress >= 1) {
    return shape[shape.length - 1];
  }
  
  // Calculate total path length
  let totalLength = 0;
  const segmentLengths: number[] = [];
  
  for (let i = 1; i < shape.length; i++) {
    const [lat1, lon1] = shape[i - 1];
    const [lat2, lon2] = shape[i];
    const segmentLength = Math.sqrt(
      Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)
    );
    segmentLengths.push(segmentLength);
    totalLength += segmentLength;
  }
  
  // Find target distance along path
  const targetDistance = progress * totalLength;
  
  // Find which segment contains the target point
  let accumulatedDistance = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segmentEnd = accumulatedDistance + segmentLengths[i];
    
    if (targetDistance <= segmentEnd) {
      // Interpolate within this segment
      const segmentProgress = (targetDistance - accumulatedDistance) / segmentLengths[i];
      const [lat1, lon1] = shape[i];
      const [lat2, lon2] = shape[i + 1];
      
      return [
        lat1 + (lat2 - lat1) * segmentProgress,
        lon1 + (lon2 - lon1) * segmentProgress
      ];
    }
    
    accumulatedDistance = segmentEnd;
  }
  
  // Should not reach here, but return last point as fallback
  return shape[shape.length - 1];
}

/**
 * Get active vehicle positions for trips currently in service
 */
export function getActiveVehicles(
  trips: ActiveTrip[],
  shapes: Record<string, [number, number][]>,
  currentMinutes: number,
  serviceId: string
): VehiclePosition[] {
  const vehicles: VehiclePosition[] = [];
  
  for (const trip of trips) {
    // Filter by service ID (trip IDs start with service ID like "0_20_...")
    if (!trip.id.startsWith(serviceId)) {
      continue;
    }
    
    // Check if trip is currently active
    if (currentMinutes < trip.start || currentMinutes > trip.end) {
      continue;
    }
    
    // Get shape for this trip
    const shape = shapes[trip.shapeId];
    if (!shape || shape.length === 0) {
      continue;
    }
    
    // Calculate progress (0-1) based on time
    const tripDuration = trip.end - trip.start;
    const elapsed = currentMinutes - trip.start;
    const progress = tripDuration > 0 ? elapsed / tripDuration : 0;
    
    // Interpolate position
    const [lat, lon] = interpolatePosition(shape, progress);
    
    vehicles.push({
      tripId: trip.id,
      lat,
      lon,
      headsign: trip.headsign,
      direction: trip.direction,
      progress
    });
  }
  
  return vehicles;
}

/**
 * Get active vehicle positions for ALL routes currently in service
 */
export function getAllActiveVehicles(
  data: AllActiveTripsData,
  currentMinutes: number,
  serviceId: string
): AllVehiclePosition[] {
  const allVehicles: AllVehiclePosition[] = [];
  
  for (const [routeId, routeData] of Object.entries(data.routes)) {
    const { trips, type, shortName } = routeData;
    
    for (const trip of trips) {
      // Filter by service ID (trip IDs start with service ID like "0_20_...")
      if (!trip.id.startsWith(serviceId)) {
        continue;
      }
      
      // Check if trip is currently active
      if (currentMinutes < trip.start || currentMinutes > trip.end) {
        continue;
      }
      
      // Get shape for this trip
      const shape = data.shapes[trip.shapeId];
      if (!shape || shape.length === 0) {
        continue;
      }
      
      // Calculate progress (0-1) based on time
      const tripDuration = trip.end - trip.start;
      const elapsed = currentMinutes - trip.start;
      const progress = tripDuration > 0 ? elapsed / tripDuration : 0;
      
      // Interpolate position
      const [lat, lon] = interpolatePosition(shape, progress);
      
      allVehicles.push({
        tripId: trip.id,
        lat,
        lon,
        headsign: trip.headsign,
        direction: trip.direction,
        progress,
        routeId,
        routeShortName: shortName,
        routeType: type
      });
    }
  }
  
  return allVehicles;
}

/**
 * GTFS Realtime types, parsing utilities, and fetch helpers.
 *
 * Types are copied from zet-live-cf-prody/src/types.ts (the Cloudflare Worker
 * proxy project) and adapted for client-side use.
 *
 * The worker at VITE_GTFS_PROXY_URL returns raw GTFS-RT protobuf binary.
 * We decode it here using the `gtfs-realtime-bindings` npm package.
 */

// gtfs-realtime-bindings is a CJS module that does `module.exports = $root`.
// In Vite's browser runtime, the entire root is exposed as the default export.
// We access transit_realtime via the namespace, falling back to .default for CJS interop.
import * as _GtfsRT from 'gtfs-realtime-bindings';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GtfsRealtimeBindings: typeof _GtfsRT = ((_GtfsRT as any).default ?? _GtfsRT) as typeof _GtfsRT;
import { GTFS_PROXY_URL, GTFS_API_KEY } from '../config';

// ============================================
// Enums — `erasableSyntaxOnly` is enabled, so native TypeScript
// `enum` declarations are not allowed. Use const objects + type aliases.
// ============================================

export const VehicleStopStatus = {
  INCOMING_AT: 0,
  STOPPED_AT: 1,
  IN_TRANSIT_TO: 2,
} as const;
export type VehicleStopStatus = (typeof VehicleStopStatus)[keyof typeof VehicleStopStatus];

export const ScheduleRelationship = {
  SCHEDULED: 0,
  SKIPPED: 1,
  NO_DATA: 2,
} as const;
export type ScheduleRelationship = (typeof ScheduleRelationship)[keyof typeof ScheduleRelationship];

export const CongestionLevel = {
  UNKNOWN_CONGESTION_LEVEL: 0,
  RUNNING_SMOOTHLY: 1,
  STOP_AND_GO: 2,
  CONGESTION: 3,
  SEVERE_CONGESTION: 4,
} as const;
export type CongestionLevel = (typeof CongestionLevel)[keyof typeof CongestionLevel];

export const OccupancyStatus = {
  EMPTY: 0,
  MANY_SEATS_AVAILABLE: 1,
  FEW_SEATS_AVAILABLE: 2,
  STANDING_ROOM_ONLY: 3,
  CRUSHED_STANDING_ROOM_ONLY: 4,
  FULL: 5,
  NOT_ACCEPTING_PASSENGERS: 6,
} as const;
export type OccupancyStatus = (typeof OccupancyStatus)[keyof typeof OccupancyStatus];

// ============================================
// Parsed types (from worker types.ts)
// ============================================

export interface ParsedVehiclePosition {
  vehicleId: string;
  tripId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number; // m/s
  timestamp: number; // POSIX timestamp
  currentStopId?: string;
  status?: VehicleStopStatus;
  congestionLevel?: CongestionLevel;
  occupancyStatus?: OccupancyStatus;
}

export interface ParsedTripUpdate {
  tripId: string;
  routeId: string;
  vehicleId?: string;
  stopTimeUpdates: ParsedStopTimeUpdate[];
  timestamp?: number;
  delay?: number; // seconds
}

export interface ParsedStopTimeUpdate {
  stopId: string;
  stopSequence?: number;
  arrivalDelay?: number; // seconds
  departureDelay?: number; // seconds
  arrivalTime?: number; // POSIX timestamp
  departureTime?: number; // POSIX timestamp
  scheduleRelationship?: ScheduleRelationship;
}

export interface FeedStatistics {
  totalEntities: number;
  vehiclePositions: number;
  tripUpdates: number;
  serviceAlerts: number;
  lastUpdate?: Date;
}

// ============================================
// Feed fetch helpers
// ============================================

type GtfsRealtimeFeed = InstanceType<typeof GtfsRealtimeBindings.transit_realtime.FeedMessage>;

/**
 * Fetch and protobuf-decode a GTFS-RT feed from the proxy worker.
 *
 * @param endpoint - Which feed to request
 * @returns Decoded protobuf FeedMessage
 * @throws Error when the proxy URL is not configured or the request fails
 */
export async function fetchRealtimeFeed(
  endpoint: 'vehicle-positions' | 'trip-updates'
): Promise<GtfsRealtimeFeed> {
  if (!GTFS_PROXY_URL) {
    throw new Error(
      'GTFS proxy URL is not configured. Set VITE_GTFS_PROXY_URL in your .env file.'
    );
  }

  const url = `${GTFS_PROXY_URL}/?endpoint=${endpoint}`;
  const headers: Record<string, string> = {};
  if (GTFS_API_KEY) {
    headers['X-API-Key'] = GTFS_API_KEY;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `GTFS proxy request failed: ${response.status} ${response.statusText}`
    );
  }

  const buffer = await response.arrayBuffer();
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );
}

// ============================================
// Parsing utilities (adapted from worker parser.ts)
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeedEntity = any;

/**
 * Parse vehicle positions from a decoded GTFS-RT feed.
 */
export function parseVehiclePositions(feed: GtfsRealtimeFeed): ParsedVehiclePosition[] {
  return feed.entity
    .filter((entity: FeedEntity) => entity.vehicle?.position)
    .map((entity: FeedEntity) => {
      const vehicle = entity.vehicle;
      return {
        vehicleId: vehicle.vehicle?.id || entity.id,
        tripId: vehicle.trip?.tripId || '',
        routeId: vehicle.trip?.routeId || '',
        latitude: vehicle.position.latitude,
        longitude: vehicle.position.longitude,
        bearing: vehicle.position?.bearing,
        speed: vehicle.position?.speed,
        timestamp: Number(vehicle.timestamp) || Math.floor(Date.now() / 1000),
        currentStopId: vehicle.stopId,
        status: vehicle.currentStatus,
        congestionLevel: vehicle.congestionLevel,
        occupancyStatus: vehicle.occupancyStatus,
      } satisfies ParsedVehiclePosition;
    });
}

/**
 * Parse trip updates from a decoded GTFS-RT feed.
 */
export function parseTripUpdates(feed: GtfsRealtimeFeed): ParsedTripUpdate[] {
  return feed.entity
    .filter((entity: FeedEntity) => entity.tripUpdate)
    .map((entity: FeedEntity) => {
      const tripUpdate = entity.tripUpdate;
      return {
        tripId: tripUpdate.trip.tripId || '',
        routeId: tripUpdate.trip.routeId || '',
        vehicleId: tripUpdate.vehicle?.id,
        stopTimeUpdates: (tripUpdate.stopTimeUpdate || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (stu: any): ParsedStopTimeUpdate => ({
            stopId: stu.stopId || '',
            stopSequence: stu.stopSequence,
            arrivalDelay: stu.arrival?.delay !== undefined ? Number(stu.arrival.delay) : undefined,
            departureDelay: stu.departure?.delay !== undefined ? Number(stu.departure.delay) : undefined,
            arrivalTime: stu.arrival?.time !== undefined ? Number(stu.arrival.time) : undefined,
            departureTime: stu.departure?.time !== undefined ? Number(stu.departure.time) : undefined,
            scheduleRelationship: stu.scheduleRelationship,
          })
        ),
        timestamp: tripUpdate.timestamp !== undefined ? Number(tripUpdate.timestamp) : undefined,
        delay: tripUpdate.delay !== undefined ? Number(tripUpdate.delay) : undefined,
      } satisfies ParsedTripUpdate;
    });
}

/**
 * Get aggregate statistics from a decoded GTFS-RT feed.
 */
export function getFeedStatistics(feed: GtfsRealtimeFeed): FeedStatistics {
  const vehiclePositions = feed.entity.filter((e: FeedEntity) => e.vehicle).length;
  const tripUpdates = feed.entity.filter((e: FeedEntity) => e.tripUpdate).length;
  const serviceAlerts = feed.entity.filter((e: FeedEntity) => e.alert).length;

  return {
    totalEntities: feed.entity.length,
    vehiclePositions,
    tripUpdates,
    serviceAlerts,
    lastUpdate: feed.header.timestamp
      ? new Date(Number(feed.header.timestamp) * 1000)
      : undefined,
  };
}

// ============================================
// Display helpers (from worker parser.ts)
// ============================================

/**
 * Format delay in a human-readable way.
 *
 * @param delaySeconds - Delay in seconds (negative = early, positive = late)
 */
export function formatDelay(delaySeconds?: number): string {
  if (delaySeconds === undefined) return '';

  const absDelay = Math.abs(delaySeconds);

  if (absDelay < 60) {
    return 'On time';
  }

  const minutes = Math.round(absDelay / 60);
  const status = delaySeconds > 0 ? 'kasni' : 'prerano';

  return `${minutes} min ${status}`;
}

/**
 * Convert speed from m/s to km/h.
 */
export function speedToKmh(speedMs?: number): number | undefined {
  return speedMs !== undefined ? Math.round(speedMs * 3.6 * 10) / 10 : undefined;
}

/**
 * Utility functions for working with processed GTFS data
 */

import { cachedFetch } from '../stores/dataCache';

// Types
export interface Stop {
  id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
  locationType: number;
  parentStation: string | null;
  /** 0 = tram-only, 3 = bus-only, 2 = mixed tram+bus; undefined = parent station / unknown */
  routeType?: number;
  /** Compass bearing in degrees (0=N, 90=E) of the direction of travel leaving this platform */
  bearing?: number;
}

export interface Route {
  id: string;
  shortName: string;
  longName: string;
  type: number; // 0 = Tram, 3 = Bus
}

export interface Trip {
  id: string;
  serviceId: string;
  headsign: string;
  direction: number;
  shapeId: string | null;
}

export interface InitialData {
  stops: Stop[];
  routes: Route[];
  calendar: Record<string, string>; // date -> service_id
  groupedParentStations?: ParentGroup[]; // optional precomputed groups added by processor
  feedVersion: string;
  feedStartDate: string;
  feedEndDate: string;
}

export interface StopTime {
  stopId: string;
  sequence: number;
  time: number; // minutes from midnight
}

export interface StopDepartures {
  routes: string[];
  departures: Record<string, Record<string, number[]>>; // service_id -> route_id -> times[]
}

/**
 * Per-stop timetable index — `public/data/stop_timetables/{stopId}.json`.
 * Keyed: routeId → tripId → { time (minutes from midnight), sequence (stop_sequence in trip) }
 */
export type StopTimetable = Record<string, Record<string, { time: number; sequence: number }>>;

export interface ActiveTrip {
  id: string;
  headsign: string;
  direction: number;
  shapeId: string;
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
  stopTimes?: [number, number][]; // [[time_minutes, shape_progress], ...] for stop-aware interpolation
}

export interface RouteActiveTripsData {
  trips: ActiveTrip[];
  shapes: Record<string, [number, number][]>;
}

export interface RouteStopsData {
  stops: string[];
  canonicalShapes?: string[];
  orderedStops?: Record<string, string[]>;
}

export interface AllActiveTripsRoute {
  trips: ActiveTrip[];
  type: number; // 0 = Tram, 3 = Bus
  shortName: string;
}

export interface AllActiveTripsData {
  routes: Record<string, AllActiveTripsRoute>;
  shapes: Record<string, [number, number][]>;
}

// Time utilities
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatTime24h(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Date utilities
export function getCurrentServiceId(calendar: Record<string, string>): string | null {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const serviceId = calendar[today];
  
  // If service exists for today, return it
  if (serviceId) {
    return serviceId;
  }
  
  // Fallback for dates outside feed range: use day-of-week default
  // 0_20 = weekday, 0_21 = Saturday, 0_22 = Sunday
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0) {
    return '0_22'; // Sunday
  } else if (dayOfWeek === 6) {
    return '0_21'; // Saturday
  } else {
    return '0_20'; // Weekday (Mon-Fri)
  }
}

export function getServiceIdForDate(calendar: Record<string, string>, date: Date): string | null {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return calendar[dateStr] || null;
}

// Route utilities
export function isRouteTypeTram(routeType: number): boolean {
  return routeType === 0;
}

export function isRouteTypeBus(routeType: number): boolean {
  return routeType === 3;
}

export function getRouteTypeName(routeType: number): string {
  switch (routeType) {
    case 0: return 'Tram';
    case 3: return 'Bus';
    default: return 'Unknown';
  }
}

// Stop utilities
export function isParentStation(stop: Stop): boolean {
  return stop.locationType === 1;
}

export function isChildPlatform(stop: Stop): boolean {
  return stop.locationType === 0 && stop.parentStation !== null;
}

// Grouped parent-station (clustering) type and helper
export interface ParentGroup {
  id: string;           // synthetic group id (e.g. "group-0")
  lat: number;          // centroid latitude
  lon: number;          // centroid longitude
  childIds: string[];   // ids of parent stations contained in this group
  count: number;        // number of parent stations in the group
}

/**
 * Cluster nearby parent stations into groups (greedy single-pass clustering).
 * - parents: array of stops that are parent stations (locationType === 1)
 * - radiusMeters: grouping radius in meters
 */
export function clusterParentStops(parents: Stop[], radiusMeters = 100): ParentGroup[] {
  if (!parents || parents.length === 0) return [];

  const used = new Set<string>();
  const groups: ParentGroup[] = [];

  const toRad = (d: number) => d * Math.PI / 180;
  const haversine = (aLat: number, aLon: number, bLat: number, bLon: number) => {
    const R = 6371000; // meters
    const dLat = toRad(bLat - aLat);
    const dLon = toRad(bLon - aLon);
    const lat1 = toRad(aLat), lat2 = toRad(bLat);
    const sinDlat = Math.sin(dLat / 2), sinDlon = Math.sin(dLon / 2);
    const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  for (let i = 0; i < parents.length; i++) {
    const p = parents[i];
    if (used.has(p.id)) continue;
    const members = [p];
    used.add(p.id);

    for (let j = i + 1; j < parents.length; j++) {
      const q = parents[j];
      if (used.has(q.id)) continue;
      if (haversine(p.lat, p.lon, q.lat, q.lon) <= radiusMeters) {
        members.push(q);
        used.add(q.id);
      }
    }

    const lat = members.reduce((s, x) => s + x.lat, 0) / members.length;
    const lon = members.reduce((s, x) => s + x.lon, 0) / members.length;
    groups.push({ id: `group-${groups.length}`, lat, lon, childIds: members.map(m => m.id), count: members.length });
  }

  return groups;
}

// Data fetching helpers
export async function fetchInitialData(): Promise<InitialData> {
  return cachedFetch('/data/initial.json', async () => {
    const response = await fetch('/data/initial.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch initial data: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function fetchRouteTrips(routeId: string): Promise<{ trips: Trip[] }> {
  return cachedFetch(`/data/routes/${routeId}.json`, async () => {
    const response = await fetch(`/data/routes/${routeId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch route ${routeId}: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function fetchRouteTimetable(routeId: string): Promise<Record<string, [string, number, number][]>> {
  return cachedFetch(`/data/timetables/${routeId}.json`, async () => {
    const response = await fetch(`/data/timetables/${routeId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch timetable for route ${routeId}: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function fetchRouteShapes(routeId: string): Promise<Record<string, [number, number][]>> {
  return cachedFetch(`/data/shapes/${routeId}.json`, async () => {
    const response = await fetch(`/data/shapes/${routeId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch shapes for route ${routeId}: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function fetchStopDepartures(stopId: string): Promise<StopDepartures> {
  return cachedFetch(`/data/stops/${stopId}.json`, async () => {
    const response = await fetch(`/data/stops/${stopId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch departures for stop ${stopId}: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function fetchRouteActiveTrips(routeId: string): Promise<RouteActiveTripsData> {
  return cachedFetch(`/data/route_active_trips/${routeId}.json`, async () => {
    const response = await fetch(`/data/route_active_trips/${routeId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch active trips for route ${routeId}: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function fetchRouteStops(routeId: string): Promise<RouteStopsData> {
  return cachedFetch(`/data/route_stops/${routeId}.json`, async () => {
    const response = await fetch(`/data/route_stops/${routeId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch route stops for route ${routeId}: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function fetchStopTimetable(stopId: string): Promise<StopTimetable> {
  return cachedFetch(`/data/stop_timetables/${stopId}.json`, async () => {
    const response = await fetch(`/data/stop_timetables/${stopId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stop timetable for ${stopId}: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function fetchAllActiveTrips(): Promise<AllActiveTripsData> {
  return cachedFetch('/data/all_active_trips.json', async () => {
    const response = await fetch('/data/all_active_trips.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch all active trips: ${response.statusText}`);
    }
    return response.json();
  });
}

// Timetable parsing helpers
export function parseTimetableEntry(entry: [string, number, number]): StopTime {
  return {
    stopId: entry[0],
    sequence: entry[1],
    time: entry[2]
  };
}

export function getTripStopTimes(timetable: Record<string, [string, number, number][]>, tripId: string): StopTime[] {
  const entries = timetable[tripId] || [];
  return entries.map(parseTimetableEntry);
}

// Departure time filtering
export function getNextDepartures(
  departures: number[],
  currentTimeMinutes: number,
  count: number = 5
): number[] {
  return departures
    .filter(time => time >= currentTimeMinutes)
    .slice(0, count);
}

export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Distance calculation (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestStops(
  stops: Stop[],
  lat: number,
  lon: number,
  limit: number = 10
): Array<Stop & { distance: number }> {
  return stops
    .map(stop => ({
      ...stop,
      distance: calculateDistance(lat, lon, stop.lat, stop.lon)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

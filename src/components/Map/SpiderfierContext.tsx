/**
 * Spiderfier context – detects overlapping Leaflet markers and fans them out.
 * Zero external dependencies: pure React + Leaflet maths.
 */
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import L from 'leaflet';

// ── Public types ─────────────────────────────────────────────────────────────

export interface SpiderfierEntry {
  id: string;
  lat: number;
  lon: number;
  /** Shown in the list-fallback popup and as tooltip on node markers. */
  label: string;
  onClick: () => void;
  /** Called fresh each time the spider fan is rendered to get the current icon. */
  getIcon?: () => L.DivIcon | null;
}

export interface SpiderfiedItem {
  id: string;
  label: string;
  originalLat: number;
  originalLon: number;
  spiderfiedLat: number;
  spiderfiedLon: number;
  icon?: L.DivIcon | null;
  onClick: () => void;
}

export interface SpiderfiedGroup {
  centerLat: number;
  centerLon: number;
  items: SpiderfiedItem[];
  /** When true render a scrollable list popup instead of a radial fan. */
  useListFallback: boolean;
}

interface SpiderfierCtx {
  register: (entry: SpiderfierEntry) => void;
  unregister: (id: string) => void;
  /**
   * Call from a marker's click handler instead of the original onClick.
   * If no overlap is detected the original onClick fires; otherwise
   * the group is spiderfied (or collapsed if already open).
   */
  triggerSpiderfy: (id: string, map: L.Map) => void;
  collapse: () => void;
  spiderfied: SpiderfiedGroup | null;
  /** Returns true when the marker with this id should hide (it's shown in fan). */
  isHidden: (id: string) => boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

export const SpiderfierContext = createContext<SpiderfierCtx | null>(null);

export function useSpiderfierContext(): SpiderfierCtx | null {
  return useContext(SpiderfierContext);
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Within this many pixels markers are treated as overlapping. */
const OVERLAP_PX = 22;

/** Fan to radial layout; beyond this count use list popup. */
const MAX_SPIDER_FAN = 8;

// ── Layout helpers ────────────────────────────────────────────────────────────

function circlePositions(count: number, center: L.Point, map: L.Map): L.LatLng[] {
  const radius = count <= 3 ? 44 : count <= 6 ? 56 : 70;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return map.containerPointToLatLng(
      L.point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle)),
    );
  });
}

function spiralPositions(count: number, center: L.Point, map: L.Map): L.LatLng[] {
  let legLength = 42;
  let angle = 0;
  return Array.from({ length: count }, () => {
    angle += Math.asin(Math.min(1, 26 / legLength)) + 0.28;
    legLength += 400 / legLength;
    return map.containerPointToLatLng(
      L.point(center.x + legLength * Math.cos(angle), center.y + legLength * Math.sin(angle)),
    );
  });
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SpiderfierProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef<Map<string, SpiderfierEntry>>(new Map());
  const [spiderfied, setSpiderfied] = useState<SpiderfiedGroup | null>(null);
  // Ref so isHidden reads the latest set without causing extra renders
  const spiderfiedIdsRef = useRef<Set<string>>(new Set());

  const register = useCallback((entry: SpiderfierEntry) => {
    registryRef.current.set(entry.id, entry);
  }, []);

  const unregister = useCallback((id: string) => {
    registryRef.current.delete(id);
  }, []);

  const collapse = useCallback(() => {
    spiderfiedIdsRef.current = new Set();
    setSpiderfied(null);
  }, []);

  const triggerSpiderfy = useCallback(
    (id: string, map: L.Map) => {
      const registry = registryRef.current;
      const clicked = registry.get(id);
      if (!clicked) return;

      // If this group is already open, collapse it
      if (spiderfiedIdsRef.current.has(id)) {
        collapse();
        return;
      }

      const clickedPx = map.latLngToContainerPoint([clicked.lat, clicked.lon]);

      // Gather all entries within OVERLAP_PX of the clicked position
      const nearby: SpiderfierEntry[] = [];
      registry.forEach((entry) => {
        const px = map.latLngToContainerPoint([entry.lat, entry.lon]);
        const dx = px.x - clickedPx.x;
        const dy = px.y - clickedPx.y;
        if (Math.sqrt(dx * dx + dy * dy) <= OVERLAP_PX) {
          nearby.push(entry);
        }
      });

      // No overlap – fire original handler directly
      if (nearby.length <= 1) {
        clicked.onClick();
        return;
      }

      const useListFallback = nearby.length > MAX_SPIDER_FAN;
      const positions = useListFallback
        ? nearby.map(() => map.containerPointToLatLng(clickedPx)) // positions unused for list
        : nearby.length <= MAX_SPIDER_FAN
          ? circlePositions(nearby.length, clickedPx, map)
          : spiralPositions(nearby.length, clickedPx, map);

      const items: SpiderfiedItem[] = nearby.map((entry, i) => ({
        id: entry.id,
        label: entry.label,
        originalLat: entry.lat,
        originalLon: entry.lon,
        spiderfiedLat: positions[i].lat,
        spiderfiedLon: positions[i].lng,
        icon: entry.getIcon?.() ?? null,
        onClick: () => {
          collapse();
          entry.onClick();
        },
      }));

      spiderfiedIdsRef.current = new Set(nearby.map((e) => e.id));
      setSpiderfied({ centerLat: clicked.lat, centerLon: clicked.lon, items, useListFallback });
    },
    [collapse],
  );

  const isHidden = useCallback((id: string) => spiderfiedIdsRef.current.has(id), []);

  const value = useMemo<SpiderfierCtx>(
    () => ({ register, unregister, triggerSpiderfy, collapse, spiderfied, isHidden }),
    [register, unregister, triggerSpiderfy, collapse, spiderfied, isHidden],
  );

  return <SpiderfierContext.Provider value={value}>{children}</SpiderfierContext.Provider>;
}

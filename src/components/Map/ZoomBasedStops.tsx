/**
 * Component that renders different stops based on zoom level
 */

import { useState, useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { StopMarkers } from './StopMarkers';
import type { Stop, ParentGroup } from '../../utils/gtfs';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMapBounds } from '../../hooks/useMapBounds';

interface ZoomBasedStopsProps {
  parentStations: Stop[];
  groupedParentStations?: ParentGroup[]; // clustered parent groups for low zooms
  platformStops: Stop[];
  parentChildCounts: Map<string, number>;
  selectedStopId: string | null;
  highlightStopIds: string[];
  onStopClick: (stopId: string) => void;
  parentClusterZoom?: number; // zoom below which we show clusters
  parentSplitZoom?: number;   // zoom at/above which parent -> platforms split
}

export function ZoomBasedStops({ 
  parentStations,
  groupedParentStations = [],
  platformStops,
  parentChildCounts,
  selectedStopId, 
  highlightStopIds,
  onStopClick,
  parentClusterZoom = 15,
  parentSplitZoom = 17
}: ZoomBasedStopsProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const bounds = useMapBounds();
  const stopDisplayMode = useSettingsStore((state) => state.stopDisplayMode);

  useEffect(() => {
    const handleZoomEnd = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // Pre-compute sets for route-based filtering (must be before any early return)
  const highlightSet = useMemo(() => new Set(highlightStopIds), [highlightStopIds]);

  // When a route is selected (highlightStopIds is populated) derive the parent
  // station IDs that belong to that route so grouped-mode can filter correctly.
  const routeParentIds = useMemo<Set<string> | null>(() => {
    if (highlightSet.size === 0) return null;
    const parents = new Set<string>();
    platformStops.forEach((s) => {
      if (highlightSet.has(s.id) && s.parentStation) parents.add(s.parentStation);
    });
    return parents;
  }, [highlightSet, platformStops]);

  // ── Individual mode ──────────────────────────────────────────────────────
  // Always show platform stops; opacity scales with zoom.
  // zoom >= 17  → factor 1.0 (fully visible)
  // 14 < zoom < 17 → linearly 0 → 1
  // zoom <= 14  → factor 0 (invisible)
  if (stopDisplayMode === 'individual') {
    const FADE_MIN = 14;
    const FADE_MAX = 17;
    const opacityFactor = zoom >= FADE_MAX
      ? 1
      : zoom <= FADE_MIN
        ? 0
        : (zoom - FADE_MIN) / (FADE_MAX - FADE_MIN);

    let visiblePlatforms = platformStops.filter((s) => bounds.contains([s.lat, s.lon]));
    // When a route is selected, only show stops on that route (always keep the selected stop).
    if (routeParentIds) {
      visiblePlatforms = visiblePlatforms.filter(
        (s) => highlightSet.has(s.id) || s.id === selectedStopId
      );
    }

    return (
      <StopMarkers
        stops={visiblePlatforms}
        isParentStationView={false}
        parentChildCounts={parentChildCounts}
        selectedStopId={selectedStopId}
        highlightStopIds={highlightStopIds}
        onStopClick={onStopClick}
        opacityFactor={opacityFactor}
      />
    );
  }

  // ── Grouped mode (original 3-tier logic) ─────────────────────────────────
  // - zoom < parentClusterZoom -> show grouped parent-station clusters
  // - parentClusterZoom <= zoom < parentSplitZoom -> show real parent stations
  // - zoom >= parentSplitZoom -> show platform stops
  let stopsToShow: Array<Stop | ParentGroup> = parentStations;
  if (zoom < parentClusterZoom && groupedParentStations.length > 0) {
    stopsToShow = groupedParentStations;
  } else if (zoom >= parentSplitZoom) {
    stopsToShow = platformStops;
  } else {
    stopsToShow = parentStations;
  }

  stopsToShow = stopsToShow.filter((s) => {
    const lat = (s as any).lat as number;
    const lon = (s as any).lon as number;
    if (!bounds.contains([lat, lon])) return false;

    // When a route is selected, hide stops not belonging to it
    if (routeParentIds) {
      const isGroup = (s as ParentGroup).childIds !== undefined;
      if (isGroup) {
        // Show cluster if any of its child parent-stations has route stops
        return (s as ParentGroup).childIds.some((id) => routeParentIds.has(id));
      }
      const id = (s as any).id as string;
      // Always keep the currently selected stop visible
      if (id === selectedStopId) return true;
      // Platform stops are in highlightSet; parent stations are in routeParentIds
      return highlightSet.has(id) || routeParentIds.has(id);
    }

    return true;
  });

  const showParentStations = zoom < parentSplitZoom;

  return (
    <StopMarkers 
      stops={stopsToShow}
      isParentStationView={showParentStations}
      parentChildCounts={parentChildCounts}
      selectedStopId={selectedStopId}
      highlightStopIds={highlightStopIds}
      onStopClick={onStopClick}
    />
  );
}

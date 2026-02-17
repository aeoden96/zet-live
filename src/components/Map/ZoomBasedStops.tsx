/**
 * Component that renders different stops based on zoom level
 */

import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { StopMarkers } from './StopMarkers';
import type { Stop, ParentGroup } from '../../utils/gtfs';

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

  useEffect(() => {
    const handleZoomEnd = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // 3-tier display logic:
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

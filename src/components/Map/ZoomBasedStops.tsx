/**
 * Component that renders different stops based on zoom level
 */

import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { StopMarkers } from './StopMarkers';
import type { Stop } from '../../utils/gtfs';

interface ZoomBasedStopsProps {
  parentStations: Stop[];
  platformStops: Stop[];
  selectedStopId: string | null;
  highlightStopIds: string[];
  onStopClick: (stopId: string) => void;
  zoomThreshold?: number;
}

export function ZoomBasedStops({ 
  parentStations,
  platformStops,
  selectedStopId, 
  highlightStopIds,
  onStopClick,
  zoomThreshold = 17
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

  // Show platform stops (individual platforms) when zoomed in
  // Show parent stations (grouped stops) when zoomed out
  const stopsToShow = zoom >= zoomThreshold ? platformStops : parentStations;

  return (
    <StopMarkers 
      stops={stopsToShow}
      selectedStopId={selectedStopId}
      highlightStopIds={highlightStopIds}
      onStopClick={onStopClick}
    />
  );
}

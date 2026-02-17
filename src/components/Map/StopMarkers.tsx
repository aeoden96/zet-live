/**
 * Render stop markers on the map
 */

import { CircleMarker } from 'react-leaflet';
import type { Stop } from '../../utils/gtfs';

interface StopMarkersProps {
  stops: Stop[];
  selectedStopId: string | null;
  highlightStopIds: string[];
  onStopClick: (stopId: string) => void;
}

export function StopMarkers({ 
  stops, 
  selectedStopId, 
  highlightStopIds,
  onStopClick
}: StopMarkersProps) {
  const highlightSet = new Set(highlightStopIds);
  
  return (
    <>
      {stops.map((stop) => {
        const isSelected = stop.id === selectedStopId;
        const isHighlighted = highlightSet.has(stop.id);
        
        return (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lon]}
            radius={isSelected ? 8 : isHighlighted ? 6 : 5}
            pathOptions={{
              fillColor: isSelected ? '#ff6b6b' : isHighlighted ? '#2337ff' : '#8242be',
              fillOpacity: isSelected ? 1 : isHighlighted ? 0.9 : 0.7,
              color: 'white',
              weight: isSelected ? 2 : 1,
            }}
            eventHandlers={{
              click: () => onStopClick(stop.id)
            }}
          />
        );
      })}
    </>
  );
}

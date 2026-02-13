/**
 * Render stop markers on the map
 */

import { CircleMarker, Popup } from 'react-leaflet';
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
              fillColor: isSelected ? '#ff6b6b' : isHighlighted ? '#2337ff' : '#14b8a6',
              fillOpacity: isSelected ? 1 : isHighlighted ? 0.9 : 0.7,
              color: 'white',
              weight: isSelected ? 2 : 1,
            }}
            eventHandlers={{
              click: () => onStopClick(stop.id)
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold">{stop.name}</div>
                {stop.code && <div className="text-gray-600">Smjer {stop.code}</div>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

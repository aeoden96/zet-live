/**
 * Render stop markers on the map
 */

import { CircleMarker, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Stop } from '../../utils/gtfs';

interface StopMarkersProps {
  stops: Stop[];
  isParentStationView: boolean;
  parentChildCounts: Map<string, number>;
  selectedStopId: string | null;
  highlightStopIds: string[];
  onStopClick: (stopId: string) => void;
}

export function StopMarkers({ 
  stops, 
  isParentStationView,
  parentChildCounts,
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
        
        // Render parent stations with custom DivIcon showing child count
        if (isParentStationView && stop.locationType === 1) {
          const childCount = parentChildCounts.get(stop.id) || 0;
          const displayCount = childCount > 9 ? '9+' : childCount.toString();
          
          const icon = L.divIcon({
            html: `<div class="parent-station-marker ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}">
              <span class="count">${displayCount}</span>
            </div>`,
            className: 'parent-station-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          
          return (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lon]}
              icon={icon}
              eventHandlers={{
                click: () => onStopClick(stop.id)
              }}
            />
          );
        }
        
        // Render regular platform stops as circle markers
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

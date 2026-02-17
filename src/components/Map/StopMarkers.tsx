/**
 * Render stop markers on the map
 */

import { CircleMarker, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Stop, ParentGroup } from '../../utils/gtfs';

interface StopMarkersProps {
  stops: Array<Stop | ParentGroup>;
  isParentStationView: boolean;
  parentChildCounts: Map<string, number>; // platform-counts per parent station id
  selectedStopId: string | null;
  highlightStopIds: string[];
  onStopClick: (stopId: string) => void;
  /** 0-1 factor applied to all marker opacity (individual mode zoom fading). Selected stops always stay at 1. */
  opacityFactor?: number;
}

export function StopMarkers({ 
  stops, 
  isParentStationView,
  parentChildCounts,
  selectedStopId, 
  highlightStopIds,
  onStopClick,
  opacityFactor = 1
}: StopMarkersProps) {
  const highlightSet = new Set(highlightStopIds as string[]);
  
  return (
    <>
      {stops.map((s) => {
        const isGroup = (s as ParentGroup).childIds !== undefined;
        const id = (s as any).id as string;
        const lat = (s as any).lat as number;
        const lon = (s as any).lon as number;

        const isSelected = id === selectedStopId;
        const isHighlighted = highlightSet.has(id);

        // Render grouped parent cluster marker
        if (isParentStationView && isGroup) {
          const group = s as ParentGroup;
          // sum platform counts for all parent stations inside this group
          const groupPlatformCount = group.childIds.reduce((acc, pid) => acc + (parentChildCounts.get(pid) || 0), 0);
          const displayCount = groupPlatformCount > 9 ? '9+' : String(groupPlatformCount || group.count);

          const icon = L.divIcon({
            html: `<div class="parent-station-marker ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}">
              <span class="count">${displayCount}</span>
            </div>`,
            className: 'parent-station-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          return (
            <Marker
              key={id}
              position={[lat, lon]}
              icon={icon}
              eventHandlers={{ click: () => onStopClick(id) }}
            />
          );
        }

        // Render parent stations (real parent stops) when in parent-station view
        if (isParentStationView && !isGroup && (s as Stop).locationType === 1) {
          const stop = s as Stop;
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
        const stop = s as Stop;
        // Selected stops always remain fully visible regardless of opacityFactor
        const effectiveFactor = isSelected ? 1 : opacityFactor;
        // Skip rendering when fully transparent (perf optimisation)
        if (effectiveFactor === 0) return null;
        return (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lon]}
            radius={isSelected ? 8 : isHighlighted ? 6 : 5}
            pathOptions={{
              fillColor: isSelected ? '#ff6b6b' : isHighlighted ? '#2337ff' : '#8242be',
              fillOpacity: (isSelected ? 1 : isHighlighted ? 0.9 : 0.7) * effectiveFactor,
              color: 'white',
              weight: isSelected ? 2 : 1,
              opacity: effectiveFactor,
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

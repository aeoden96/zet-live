/**
 * Render stop markers on the map
 */

import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Stop, ParentGroup } from '../../utils/gtfs';

// ── Stop colour by service type ──────────────────────────────────────────────
function stopFillColor(stop: Stop, isSelected: boolean, isHighlighted: boolean): string {
  if (isSelected) return '#ff6b6b';
  if (isHighlighted) return '#2337ff';
  switch (stop.routeType) {
    case 0: return '#2563eb';  // tram-only  → blue
    case 3: return '#ea580c';  // bus-only   → orange
    case 2: return '#8242be';  // mixed       → purple
    default: return '#8242be'; // fallback    → purple
  }
}

/**
 * Build a DivIcon for a platform stop marker.
 * When `bearing` is supplied a small directional triangle is rendered
 * just outside the circle, pointing in the direction of travel.
 */
function makeStopIcon(
  color: string,
  bearing: number | undefined,
  size: number,
  r: number,
  opacityFactor: number,
): L.DivIcon {
  const cx = size / 2;

  if (bearing !== undefined) {
    const pinTipY  = cx - r - 4;
    const pinBaseY = cx - r;
    const pinHalfW = 3;
    const html =
      `<div style="position:relative;width:${size}px;height:${size}px;opacity:${opacityFactor};">` +
        `<svg style="position:absolute;top:0;left:0;transform:rotate(${bearing}deg);transform-origin:${cx}px ${cx}px;"` +
             ` width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
          `<polygon points="${cx},${pinTipY} ${cx - pinHalfW},${pinBaseY} ${cx + pinHalfW},${pinBaseY}"` +
                   ` fill="${color}" stroke="white" stroke-width="1" stroke-linejoin="round"/>` +
        `</svg>` +
        `<svg style="position:absolute;top:0;left:0;" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
          `<circle cx="${cx}" cy="${cx}" r="${r}" fill="${color}" fill-opacity="0.9" stroke="white" stroke-width="1.5"/>` +
        `</svg>` +
      `</div>`;
    return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [cx, cx] });
  }

  const html =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"` +
        ` style="opacity:${opacityFactor}">` +
      `<circle cx="${cx}" cy="${cx}" r="${r}" fill="${color}" fill-opacity="0.9" stroke="white" stroke-width="1.5"/>` +
    `</svg>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [cx, cx] });
}

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

        // Render regular platform stops
        const stop = s as Stop;
        // Selected stops always remain fully visible regardless of opacityFactor
        const effectiveFactor = isSelected ? 1 : opacityFactor;
        // Skip rendering when fully transparent (perf optimisation)
        if (effectiveFactor === 0) return null;

        const color = stopFillColor(stop, isSelected, isHighlighted);
        const size  = isSelected ? 30 : isHighlighted ? 26 : 24;
        const r     = isSelected ?  9 : isHighlighted ?  8 :  7;
        const icon  = makeStopIcon(color, stop.bearing, size, r, effectiveFactor);

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lon]}
            icon={icon}
            eventHandlers={{ click: () => onStopClick(stop.id) }}
          />
        );
      })}
    </>
  );
}

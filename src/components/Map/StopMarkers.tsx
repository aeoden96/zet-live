/**
 * Render stop markers on the map
 */

import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { Stop, ParentGroup } from '../../utils/gtfs';
import { getDirectionColor } from './directionColors';

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
  label?: string,
): L.DivIcon {
  const cx = size / 2;

  const safeLabel = label
    ? String(label).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : '';

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
        `${safeLabel ? `<span class="stop-label">${safeLabel}</span>` : ''}` +
      `</div>`;
    return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [cx, cx] });
  }

  const html =
    `<div style="position:relative;width:${size}px;height:${size}px;">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"` +
          ` style="opacity:${opacityFactor}">` +
        `<circle cx="${cx}" cy="${cx}" r="${r}" fill="${color}" fill-opacity="0.9" stroke="white" stroke-width="1.5"/>` +
      `</svg>` +
      `${safeLabel ? `<span class="stop-label">${safeLabel}</span>` : ''}` +
    `</div>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [cx, cx] });
}

interface StopMarkersProps {
  stops: Array<Stop | ParentGroup>;
  isParentStationView: boolean;
  parentChildCounts: Map<string, number>; // platform-counts per parent station id
  /** Optional parent station list (used when individual mode wants parent labels/lines) */
  parentStations?: Stop[];
  selectedStopId: string | null;
  highlightStopIds: string[];
  /** Optional mapping stopId -> direction index (0,1,...) for highlighted stops */
  stopDirectionMap?: Record<string, number>;
  onStopClick: (stopId: string) => void;
  /** 0-1 factor applied to all marker opacity (individual mode zoom fading). Selected stops always stay at 1. */
  opacityFactor?: number;
  /** When true, platform stop labels are rendered inside the DivIcon (used at max zoom) */
  showLabels?: boolean;
}

export function StopMarkers({ 
  stops, 
  isParentStationView,
  parentStations,
  parentChildCounts,
  selectedStopId, 
  highlightStopIds,
  stopDirectionMap,
  onStopClick,
  opacityFactor = 1,
  showLabels = false
}: StopMarkersProps) {
  const highlightSet = new Set(highlightStopIds as string[]);
  
  // Build a lookup of parent stations by id for quick access
  const parentMap = new Map<string, Stop>();
  if (parentStations) parentStations.forEach((p) => parentMap.set(p.id, p));

  // When showing labels at parent locations, compute grouped parent labels by name.
  // If multiple parent stations share the same name and are within a small distance,
  // show a single label at the centroid and connect it to all child platform stops.
  type ParentLabelGroup = { label: string; lat: number; lon: number; children: Stop[] };
  const parentLabelGroups: ParentLabelGroup[] = [];
  if (showLabels && parentStations) {
    const platformStops = stops.filter((s) => (s as Stop).locationType === undefined || (s as Stop).locationType === 0) as Stop[];
    const childrenByParent = new Map<string, Stop[]>();
    platformStops.forEach((st) => {
      if (st.parentStation) {
        const arr = childrenByParent.get(st.parentStation) || [];
        arr.push(st);
        childrenByParent.set(st.parentStation, arr);
      }
    });

    // Group parents by normalized name
    const nameGroups = new Map<string, { parents: Stop[]; children: Stop[] }>();
    childrenByParent.forEach((children, pid) => {
      const parent = parentMap.get(pid);
      if (!parent || children.length === 0) return;
      const key = parent.name.trim().toLowerCase();
      const entry = nameGroups.get(key) || { parents: [], children: [] };
      entry.parents.push(parent);
      entry.children.push(...children);
      nameGroups.set(key, entry);
    });

    // Haversine distance helper (meters)
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (deg: number) => deg * Math.PI / 180;
      const R = 6371000; // meters
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const MERGE_THRESHOLD_METERS = 60; // parents within this distance will share a label
    nameGroups.forEach((entry, key) => {
      if (entry.parents.length === 1) {
        const p = entry.parents[0];
        parentLabelGroups.push({ label: p.name, lat: p.lat, lon: p.lon, children: entry.children });
        return;
      }

      // compute centroid of parent positions
      const sum = entry.parents.reduce((acc, p) => ({ lat: acc.lat + p.lat, lon: acc.lon + p.lon }), { lat: 0, lon: 0 });
      const centroidLat = sum.lat / entry.parents.length;
      const centroidLon = sum.lon / entry.parents.length;

      // check spatial spread — if parents are far apart, don't merge; render separate labels instead
      const maxDist = Math.max(...entry.parents.map((p) => haversine(p.lat, p.lon, centroidLat, centroidLon)));
      if (maxDist <= MERGE_THRESHOLD_METERS) {
        parentLabelGroups.push({ label: entry.parents[0].name, lat: centroidLat, lon: centroidLon, children: entry.children });
      } else {
        // keep separate labels for each parent
        entry.parents.forEach((p) => {
          const pChildren = entry.children.filter((c) => c.parentStation === p.id);
          if (pChildren.length > 0) parentLabelGroups.push({ label: p.name, lat: p.lat, lon: p.lon, children: pChildren });
        });
      }
    });
  }
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

        // If highlighted and a direction map is available, use the direction color
        let color = stopFillColor(stop, isSelected, isHighlighted);
        if (isHighlighted && stopDirectionMap && stopDirectionMap[id] !== undefined) {
          const dirIdx = stopDirectionMap[id];
          color = getDirectionColor(stop.routeType ?? null, dirIdx);
        }
        const size  = isSelected ? 30 : isHighlighted ? 26 : 24;
        const r     = isSelected ?  9 : isHighlighted ?  8 :  7;
        // Platform stops should not have inline labels; parent station labels are rendered separately.
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
      {/* Render parent labels and connector lines when requested (individual-mode enhancement) */}
      {showLabels && parentLabelGroups.map(({ label, lat, lon, children }, idx) => (
        <span key={`parent-label-${idx}`}>
          <Marker
            position={[lat, lon]}
            icon={L.divIcon({ html: `<span class="parent-station-label">${String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] })}
            interactive={false}
          />
          {children.map((c) => (
            <Polyline
              key={`line-${idx}-${c.id}`}
              positions={[[lat, lon], [c.lat, c.lon]]}
              pathOptions={{ color: '#6b7280', weight: 1, opacity: 0.9 }}
            />
          ))}
        </span>
      ))}
    </>
  );
}

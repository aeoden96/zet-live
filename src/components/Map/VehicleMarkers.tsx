/**
 * Render vehicle position markers on the map
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import type { VehiclePosition } from '../../utils/vehicles';
import { makeVehicleIcon } from '../../utils/vehicleIcon';
import { getDirectionColor } from './directionColors';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMapBounds } from '../../hooks/useMapBounds';
import { useSpiderfierContext } from './SpiderfierContext';

// ── Spiderfied vehicle sub-component ──────────────────────────────────

interface SpiderfiedVehicleMarkerProps {
  vehicle: VehiclePosition;
  color: string;
  routeShortName: string;
  theme: string;
}

function SpiderfiedVehicleMarker({
  vehicle,
  color,
  routeShortName,
  theme,
}: SpiderfiedVehicleMarkerProps) {
  const map = useMap();
  const ctx = useSpiderfierContext();
  const label = routeShortName
    ? `${routeShortName} – ${vehicle.headsign}`
    : vehicle.headsign;

  // Compute icon before hooks so iconRef always holds the latest value
  const icon = makeVehicleIcon(color, vehicle.bearing, vehicle.isRealtime, routeShortName, theme === 'dark');
  const iconRef = useRef(icon);
  useLayoutEffect(() => { iconRef.current = icon; });

  useEffect(() => {
    if (!ctx) return;
    ctx.register({
      id: vehicle.tripId,
      lat: vehicle.lat,
      lon: vehicle.lon,
      label,
      onClick: () => {}, // route already selected; spiderfy just separates overlapping vehicles
      getIcon: () => iconRef.current,
    });
    return () => ctx.unregister(vehicle.tripId);
  }, [vehicle.tripId, vehicle.lat, vehicle.lon, label, ctx]);

  if (ctx?.isHidden(vehicle.tripId)) return null;

  return (
    <Marker
      position={[vehicle.lat, vehicle.lon]}
      icon={icon}
      eventHandlers={{
        click: (e) => {
          e.originalEvent.stopPropagation();
          ctx?.triggerSpiderfy(vehicle.tripId, map);
        },
      }}
    />
  );
}

interface VehicleMarkersProps {
  vehicles: VehiclePosition[];
  routeType: number | null;
  routeShortName?: string;
}

export function VehicleMarkers({ vehicles, routeType, routeShortName = '' }: VehicleMarkersProps) {
  // Color by direction if available, else fallback to routeType color
  const theme = useSettingsStore((s) => s.theme);
  const bounds = useMapBounds();
  const visible = vehicles.filter((v) => bounds.contains([v.lat, v.lon]));

  return (
    <>
      {visible.map((vehicle) => {
        const color = getDirectionColor(routeType, vehicle.direction ?? 0);
        return (
          <SpiderfiedVehicleMarker
            key={vehicle.tripId}
            vehicle={vehicle}
            color={color}
            routeShortName={routeShortName}
            theme={theme}
          />
        );
      })}
    </>
  );
}

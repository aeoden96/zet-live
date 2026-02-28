/**
 * Render all vehicle position markers on the map
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import type { AllVehiclePosition } from '../../utils/vehicles';
import { makeVehicleIcon } from '../../utils/vehicleIcon';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMapBounds } from '../../hooks/useMapBounds';
import { useSpiderfierContext } from './SpiderfierContext';

// ── Spiderfied sub-component for all-vehicles view ───────────────────────

interface SpiderfiedAllVehicleMarkerProps {
  vehicle: AllVehiclePosition;
  theme: string;
  onVehicleClick?: (routeId: string, routeType: number) => void;
}

function SpiderfiedAllVehicleMarker({
  vehicle,
  theme,
  onVehicleClick,
}: SpiderfiedAllVehicleMarkerProps) {
  const map = useMap();
  const ctx = useSpiderfierContext();
  const label = vehicle.routeShortName
    ? `${vehicle.routeShortName} – ${vehicle.headsign}`
    : vehicle.headsign;

  // Compute icon before hooks so iconRef always holds the latest value
  const color = vehicle.routeType === 0 ? '#2337ff' : '#ff6b35';
  const icon = makeVehicleIcon(color, vehicle.bearing, vehicle.isRealtime, vehicle.routeShortName, theme === 'dark');
  const iconRef = useRef(icon);
  useLayoutEffect(() => { iconRef.current = icon; });

  useEffect(() => {
    if (!ctx) return;
    ctx.register({
      id: vehicle.tripId,
      lat: vehicle.lat,
      lon: vehicle.lon,
      label,
      onClick: () => onVehicleClick?.(vehicle.routeId, vehicle.routeType),
      getIcon: () => iconRef.current,
      hideLabel: true, // icon already shows the route number; no need for a text bubble
    });
    return () => ctx.unregister(vehicle.tripId);
  }, [vehicle.tripId, vehicle.lat, vehicle.lon, label, onVehicleClick, vehicle.routeId, vehicle.routeType, ctx]);

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

interface AllVehicleMarkersProps {
  vehicles: AllVehiclePosition[];
  onVehicleClick?: (routeId: string, routeType: number) => void;
}

export function AllVehicleMarkers({ vehicles, onVehicleClick }: AllVehicleMarkersProps) {
  const bounds = useMapBounds();
  const theme = useSettingsStore((s) => s.theme);
  const visible = vehicles.filter((v) => bounds.contains([v.lat, v.lon]));

  return (
    <>
      {visible.map((vehicle) => (
        <SpiderfiedAllVehicleMarker
          key={vehicle.tripId}
          vehicle={vehicle}
          theme={theme}
          onVehicleClick={onVehicleClick}
        />
      ))}
    </>
  );
}

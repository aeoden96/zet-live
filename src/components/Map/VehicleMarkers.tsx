/**
 * Render vehicle position markers on the map
 */

import { Marker } from 'react-leaflet';
import type { VehiclePosition } from '../../utils/vehicles';
import { makeVehicleIcon } from '../../utils/vehicleIcon';
import { getDirectionColor } from './directionColors';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMapBounds } from '../../hooks/useMapBounds';

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
        // Use direction-based color if direction is defined (0,1,...)
        const color = getDirectionColor(routeType, vehicle.direction ?? 0);
        const icon = makeVehicleIcon(color, vehicle.bearing, vehicle.isRealtime, routeShortName, theme === 'dark');
        return (
          <Marker
            key={vehicle.tripId}
            position={[vehicle.lat, vehicle.lon]}
            icon={icon}
          />
        );
      })}
    </>
  );
}

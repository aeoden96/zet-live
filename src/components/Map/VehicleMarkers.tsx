/**
 * Render vehicle position markers on the map
 */

import { Marker } from 'react-leaflet';
import type { VehiclePosition } from '../../utils/vehicles';
import { makeVehicleIcon } from '../../utils/vehicleIcon';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMapBounds } from '../../hooks/useMapBounds';

interface VehicleMarkersProps {
  vehicles: VehiclePosition[];
  routeType: number | null;
  routeShortName?: string;
}

export function VehicleMarkers({ vehicles, routeType, routeShortName = '' }: VehicleMarkersProps) {
  // Tram: blue, Bus: orange
  const color = routeType === 0 ? '#2337ff' : '#ff6b35';
  const theme = useSettingsStore((s) => s.theme);
  const bounds = useMapBounds();
  const visible = vehicles.filter((v) => bounds.contains([v.lat, v.lon]));

  return (
    <>
      {visible.map((vehicle) => {
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

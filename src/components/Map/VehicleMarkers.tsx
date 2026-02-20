/**
 * Render vehicle position markers on the map
 */

import { Marker } from 'react-leaflet';
import type { VehiclePosition } from '../../utils/vehicles';
import { formatDelay, speedToKmh } from '../../utils/realtime';
import { makeVehicleIcon } from '../../utils/vehicleIcon';
import { useMapBounds } from '../../hooks/useMapBounds';

interface VehicleMarkersProps {
  vehicles: VehiclePosition[];
  routeType: number | null;
}

export function VehicleMarkers({ vehicles, routeType }: VehicleMarkersProps) {
  // Tram: blue, Bus: orange
  const color = routeType === 0 ? '#2337ff' : '#ff6b35';
  const bounds = useMapBounds();
  const visible = vehicles.filter((v) => bounds.contains([v.lat, v.lon]));

  return (
    <>
      {visible.map((vehicle) => {
        const speedKmh = speedToKmh(vehicle.speed);
        const delayStr = formatDelay(vehicle.delay);
        const icon = makeVehicleIcon(color, vehicle.bearing, vehicle.isRealtime, vehicle.routeShortName);

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

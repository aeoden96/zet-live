/**
 * Render all vehicle position markers on the map
 */

import { Marker } from 'react-leaflet';
import type { AllVehiclePosition } from '../../utils/vehicles';
import { formatDelay, speedToKmh } from '../../utils/realtime';
import { makeVehicleIcon } from '../../utils/vehicleIcon';
import { useMapBounds } from '../../hooks/useMapBounds';

interface AllVehicleMarkersProps {
  vehicles: AllVehiclePosition[];
  onVehicleClick?: (routeId: string, routeType: number) => void;
}

export function AllVehicleMarkers({ vehicles, onVehicleClick }: AllVehicleMarkersProps) {
  const bounds = useMapBounds();
  const visible = vehicles.filter((v) => bounds.contains([v.lat, v.lon]));

  return (
    <>
      {visible.map((vehicle) => {
        // Tram: blue, Bus: orange
        const color = vehicle.routeType === 0 ? '#2337ff' : '#ff6b35';
        const speedKmh = speedToKmh(vehicle.speed);
        const delayStr = formatDelay(vehicle.delay);
        const icon = makeVehicleIcon(color, vehicle.bearing, vehicle.isRealtime, vehicle.routeShortName);

        return (
          <Marker
            key={vehicle.tripId}
            position={[vehicle.lat, vehicle.lon]}
            icon={icon}
            eventHandlers={onVehicleClick ? { click: () => onVehicleClick(vehicle.routeId, vehicle.routeType) } : undefined}
          />
        );
      })}
    </>
  );
}

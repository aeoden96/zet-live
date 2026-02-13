/**
 * Render vehicle position markers on the map
 */

import { CircleMarker, Tooltip } from 'react-leaflet';
import type { VehiclePosition } from '../../utils/vehicles';

interface VehicleMarkersProps {
  vehicles: VehiclePosition[];
  routeType: number | null;
}

export function VehicleMarkers({ vehicles, routeType }: VehicleMarkersProps) {
  // Tram: blue, Bus: orange
  const color = routeType === 0 ? '#2337ff' : '#ff6b35';
  
  return (
    <>
      {vehicles.map((vehicle) => {
        return (
          <CircleMarker
            key={vehicle.tripId}
            center={[vehicle.lat, vehicle.lon]}
            radius={8}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.8,
              color: '#ffffff',
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
            <div className="text-xs">
              <div className="font-bold">{vehicle.headsign}</div>
              <div className="text-gray-600">
                Smjer: {vehicle.direction === 0 ? 'A' : 'B'}
              </div>
            </div>
          </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

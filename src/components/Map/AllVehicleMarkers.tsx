/**
 * Render all vehicle position markers on the map
 */

import { CircleMarker, Tooltip } from 'react-leaflet';
import type { AllVehiclePosition } from '../../utils/vehicles';

interface AllVehicleMarkersProps {
  vehicles: AllVehiclePosition[];
}

export function AllVehicleMarkers({ vehicles }: AllVehicleMarkersProps) {
  return (
    <>
      {vehicles.map((vehicle) => {
        // Tram: blue, Bus: orange
        const color = vehicle.routeType === 0 ? '#2337ff' : '#ff6b35';
        
        return (
          <CircleMarker
            key={vehicle.tripId}
            center={[vehicle.lat, vehicle.lon]}
            radius={6}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.8,
              color: '#ffffff',
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="text-xs">
                <div className="font-bold">
                  {vehicle.routeShortName} • {vehicle.headsign}
                </div>
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

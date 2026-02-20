/**
 * Render vehicle position markers on the map
 */

import { Marker, Tooltip } from 'react-leaflet';
import type { VehiclePosition } from '../../utils/vehicles';
import { formatDelay, speedToKmh } from '../../utils/realtime';
import { makeVehicleIcon } from '../../utils/vehicleIcon';

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
        const speedKmh = speedToKmh(vehicle.speed);
        const delayStr = formatDelay(vehicle.delay);
        const icon = makeVehicleIcon(color, vehicle.bearing, vehicle.isRealtime, vehicle.routeShortName);

        return (
          <Marker
            key={vehicle.tripId}
            position={[vehicle.lat, vehicle.lon]}
            icon={icon}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="text-xs">
                <div className="font-bold">{vehicle.headsign}</div>
                <div className="text-gray-600">
                  Smjer: {vehicle.direction === 0 ? 'A' : 'B'}
                </div>
                {vehicle.isRealtime && (
                  <>
                    {speedKmh !== undefined && (
                      <div className="text-blue-600">{speedKmh} km/h</div>
                    )}
                    {delayStr && (
                      <div
                        className={
                          vehicle.delay !== undefined && vehicle.delay > 60
                            ? 'text-red-600'
                            : 'text-green-600'
                        }
                      >
                        {delayStr}
                      </div>
                    )}
                    <div className="text-gray-400 italic">GPS uživo</div>
                  </>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

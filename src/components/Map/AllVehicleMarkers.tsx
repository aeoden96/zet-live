/**
 * Render all vehicle position markers on the map
 */

import { CircleMarker, Tooltip } from 'react-leaflet';
import type { AllVehiclePosition } from '../../utils/vehicles';
import { formatDelay, speedToKmh } from '../../utils/realtime';

interface AllVehicleMarkersProps {
  vehicles: AllVehiclePosition[];
}

export function AllVehicleMarkers({ vehicles }: AllVehicleMarkersProps) {
  return (
    <>
      {vehicles.map((vehicle) => {
        // Tram: blue, Bus: orange
        const color = vehicle.routeType === 0 ? '#2337ff' : '#ff6b35';
        const speedKmh = speedToKmh(vehicle.speed);
        const delayStr = formatDelay(vehicle.delay);

        return (
          <CircleMarker
            key={vehicle.tripId}
            center={[vehicle.lat, vehicle.lon]}
            radius={6}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.8,
              color: vehicle.isRealtime ? '#ffffff' : '#aaaaaa',
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="text-xs">
                <div className="font-bold">
                  {vehicle.routeShortName} • {vehicle.headsign}
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
          </CircleMarker>
        );
      })}
    </>
  );
}

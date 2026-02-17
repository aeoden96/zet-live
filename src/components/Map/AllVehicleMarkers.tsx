/**
 * Render all vehicle position markers on the map
 */

import { Marker, Tooltip } from 'react-leaflet';
import type { AllVehiclePosition } from '../../utils/vehicles';
import { formatDelay, speedToKmh } from '../../utils/realtime';
import { makeVehicleIcon } from '../../utils/vehicleIcon';

interface AllVehicleMarkersProps {
  vehicles: AllVehiclePosition[];
  onVehicleClick?: (routeId: string, routeType: number) => void;
}

export function AllVehicleMarkers({ vehicles, onVehicleClick }: AllVehicleMarkersProps) {
  return (
    <>
      {vehicles.map((vehicle) => {
        // Tram: blue, Bus: orange
        const color = vehicle.routeType === 0 ? '#2337ff' : '#ff6b35';
        const speedKmh = speedToKmh(vehicle.speed);
        const delayStr = formatDelay(vehicle.delay);
        const icon = makeVehicleIcon(color, vehicle.bearing, vehicle.isRealtime);

        return (
          <Marker
            key={vehicle.tripId}
            position={[vehicle.lat, vehicle.lon]}
            icon={icon}
            eventHandlers={onVehicleClick ? { click: () => onVehicleClick(vehicle.routeId, vehicle.routeType) } : undefined}
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
          </Marker>
        );
      })}
    </>
  );
}

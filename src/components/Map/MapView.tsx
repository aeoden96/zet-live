/**
 * Main Leaflet map component
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import type { Stop } from '../../utils/gtfs';
import type { VehiclePosition, AllVehiclePosition } from '../../utils/vehicles';
import { StopMarkers } from './StopMarkers';
import { RouteShape } from './RouteShape';
import { VehicleMarkers } from './VehicleMarkers';
import { AllVehicleMarkers } from './AllVehicleMarkers';

const ZAGREB_CENTER: [number, number] = [45.815, 15.977];
const DEFAULT_ZOOM = 13;

interface MapViewProps {
  stops: Stop[];
  selectedRouteId: string | null;
  selectedStopId: string | null;
  routeShapes: Record<string, [number, number][]>;
  routeStops: string[];
  vehicles: VehiclePosition[];
  routeType: number | null;
  onStopClick: (stopId: string) => void;
  showAllVehicles?: boolean;
  allVehicles?: AllVehiclePosition[];
}

export function MapView({
  stops,
  selectedRouteId,
  selectedStopId,
  routeShapes,
  routeStops,
  vehicles,
  routeType,
  onStopClick,
  showAllVehicles = false,
  allVehicles = []
}: MapViewProps) {
  return (
    <MapContainer
      center={ZAGREB_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={11}
      maxZoom={18}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <StopMarkers 
        stops={stops}
        selectedStopId={selectedStopId}
        highlightStopIds={selectedRouteId ? routeStops : []}
        onStopClick={onStopClick}
      />
      
      {showAllVehicles && (
        <AllVehicleMarkers vehicles={allVehicles} />
      )}
      
      {selectedRouteId && (
        <>
          <RouteShape 
            shapes={routeShapes}
            routeType={routeType}
          />
          <VehicleMarkers 
            vehicles={vehicles}
            routeType={routeType}
          />
        </>
      )}
    </MapContainer>
  );
}

/**
 * Main Leaflet map component
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import type { Stop, Route, ParentGroup } from '../../utils/gtfs';
import type { VehiclePosition, AllVehiclePosition } from '../../utils/vehicles';
import { ZoomBasedStops } from './ZoomBasedStops';
import { RouteShape } from './RouteShape';
import { VehicleMarkers } from './VehicleMarkers';
import { AllVehicleMarkers } from './AllVehicleMarkers';
import { ParentStationZoomController } from './ParentStationZoomController';
import { OffScreenStopIndicator } from './OffScreenStopIndicator';
import { useSettingsStore } from '../../stores/settingsStore';

const ZAGREB_CENTER: [number, number] = [45.815, 15.977];
const DEFAULT_ZOOM = 13;

interface MapViewProps {
  parentStations: Stop[];
  groupedParentStations?: ParentGroup[];
  platformStops: Stop[];
  parentChildCounts: Map<string, number>;
  selectedRouteId: string | null;
  selectedStopId: string | null;
  routeShapes: Record<string, [number, number][]>;
  routeStops: string[];
  vehicles: VehiclePosition[];
  routeType: number | null;
  onStopClick: (stopId: string) => void;
  onVehicleClick?: (routeId: string, routeType: number) => void;
  showAllVehicles?: boolean;
  allVehicles?: AllVehiclePosition[];
  routesById: Map<string, Route>;
  serviceId: string | null;
  parentStationZoomTarget: { lat: number; lon: number; zoom?: number } | null;
  onZoomComplete: () => void;
  /** Stop object for off-screen directional indicator */
  selectedStop?: Stop | null;
  onFlyToStop?: () => void;
}

const TILE_PROVIDERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  'dark-matter': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

export function MapView({
  parentStations,
  groupedParentStations,
  platformStops,
  parentChildCounts,
  selectedRouteId,
  selectedStopId,
  routeShapes,
  routeStops,
  vehicles,
  routeType,
  onStopClick,
  onVehicleClick,
  showAllVehicles = false,
  allVehicles = [],
  // routesById and serviceId are declared in the interface for future use
  // but are not consumed by the map component directly
  parentStationZoomTarget,
  onZoomComplete,
  selectedStop,
  onFlyToStop
}: MapViewProps) {
  const mapTileProvider = useSettingsStore((state) => state.mapTileProvider);
  const tileConfig = TILE_PROVIDERS[mapTileProvider];

  return (
    <MapContainer
      center={ZAGREB_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={11}
      maxZoom={18}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        key={mapTileProvider}
        attribution={tileConfig.attribution}
        url={tileConfig.url}
      />
      
      <ParentStationZoomController
        zoomTarget={parentStationZoomTarget}
        onZoomComplete={onZoomComplete}
      />

      {selectedStop && onFlyToStop && (
        <OffScreenStopIndicator stop={selectedStop} onFlyTo={onFlyToStop} />
      )}
      
      <ZoomBasedStops 
        parentStations={parentStations}
        groupedParentStations={groupedParentStations}
        platformStops={platformStops}
        parentChildCounts={parentChildCounts}
        selectedStopId={selectedStopId}
        highlightStopIds={selectedRouteId ? routeStops : []}
        onStopClick={onStopClick}
      />
      
      {showAllVehicles && (
        <AllVehicleMarkers vehicles={allVehicles} onVehicleClick={onVehicleClick} />
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

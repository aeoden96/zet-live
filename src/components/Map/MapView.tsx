/**
 * Main Leaflet map component
 */

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Stop, Route, ParentGroup } from '../../utils/gtfs';
import type { VehiclePosition, AllVehiclePosition } from '../../utils/vehicles';
import { ZoomBasedStops } from './ZoomBasedStops';
import { RouteShape } from './RouteShape';
import { VehicleMarkers } from './VehicleMarkers';
import { AllVehicleMarkers } from './AllVehicleMarkers';
import { ParentStationZoomController } from './ParentStationZoomController';
import { OffScreenStopIndicator } from './OffScreenStopIndicator';
import { SpiderfierProvider } from './SpiderfierContext';
import { SpiderfierManager } from './SpiderfierManager';
import { BikeStations } from './BikeStations';
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
  orderedStops?: Record<string, string[]>;
  vehicles: VehiclePosition[];
  routeType: number | null;
  routeShortName?: string;
  onStopClick: (stopId: string) => void;
  onVehicleClick?: (routeId: string, routeType: number) => void;
  showAllVehicles?: boolean;
  showBikeStations?: boolean;
  allVehicles?: AllVehiclePosition[];
  routesById: Map<string, Route>;
  serviceId: string | null;
  userLocation?: { lat: number; lon: number } | null;
  parentStationZoomTarget: { lat: number; lon: number; zoom?: number } | null;
  onZoomComplete: () => void;
  /** Stop object for off-screen directional indicator */
  selectedStop?: Stop | null;
  onFlyToStop?: () => void;
}

const TILE_PROVIDERS = {
  osm: {
    // Use the HOT (Humanitarian) tile style which has slightly more detail
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.hotosm.org/">HOT</a>'
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
  orderedStops,
  vehicles,
  routeType,
  routeShortName,
  onStopClick,
  onVehicleClick,
  showAllVehicles = false,
  showBikeStations = false,
  allVehicles = [],
  userLocation,
  // routesById and serviceId are declared in the interface for future use
  // but are not consumed by the map component directly
  parentStationZoomTarget,
  onZoomComplete,
  selectedStop,
  onFlyToStop
}: MapViewProps) {
  const theme = useSettingsStore((state) => state.theme);
  const detailedMap = useSettingsStore((state) => state.detailedMap);
  const providerId: keyof typeof TILE_PROVIDERS = detailedMap
    ? (theme === 'dark' ? 'dark-matter' : 'osm')
    : (theme === 'dark' ? 'dark-matter' : 'positron');
  const tileConfig = TILE_PROVIDERS[providerId];

  return (
    <SpiderfierProvider>
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
          key={providerId}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />

        <SpiderfierManager />

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
          orderedStops={orderedStops}
          onStopClick={onStopClick}
        />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={L.divIcon({
              html: `<div class="user-location-marker"><span class="pulse"></span><span class="dot"></span></div>`,
              className: 'user-location-icon',
              iconSize: [44, 44],
              iconAnchor: [22, 22],
            })}
          />
        )}

        {showAllVehicles && (
          <AllVehicleMarkers vehicles={allVehicles} onVehicleClick={onVehicleClick} />
        )}

        <BikeStations show={showBikeStations} />

        {selectedRouteId && (
          <>
            <RouteShape
              shapes={routeShapes}
              routeType={routeType}
              orderedStops={orderedStops}
            />
            <VehicleMarkers
              vehicles={vehicles}
              routeType={routeType}
              routeShortName={routeShortName}
            />
          </>
        )}
      </MapContainer>
    </SpiderfierProvider>
  );
}

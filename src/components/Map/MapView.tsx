/**
 * Main Leaflet map component
 */

import { BaseMap } from './BaseMap';
import type { Stop, Route } from '../../utils/gtfs';
import type { VehiclePosition, AllVehiclePosition } from '../../utils/vehicles';
import { ZoomBasedStops } from './ZoomBasedStops';
import { RouteShape } from './RouteShape';
import { VehicleMarkers } from './VehicleMarkers';
import { AllVehicleMarkers } from './AllVehicleMarkers';
import { ParentStationZoomController } from './ParentStationZoomController';
import { OffScreenStopIndicator } from './OffScreenStopIndicator';
import { SpiderfierProvider } from './SpiderfierContext';
import { SpiderfierManager } from './SpiderfierManager';
import { RoadClosures } from './RoadClosures';
import { useRoadClosures } from '../../hooks/useRoadClosures';
import { useGTFSMode } from '../../contexts/GTFSModeContext';


interface MapViewProps {
  parentStations: Stop[];
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
  showRoadClosures?: boolean;
  allVehicles?: AllVehiclePosition[];
  routesById: Map<string, Route>;
  serviceId: string | null;
  userLocation?: { lat: number; lon: number } | null;
  locationPanOffsetY?: number;
  parentStationZoomTarget: { lat: number; lon: number; zoom?: number; panOffsetY?: number } | null;
  onZoomComplete: () => void;
  /** Stop object for off-screen directional indicator */
  selectedStop?: Stop | null;
  onFlyToStop?: () => void;
  highlightStopIds?: string[];
  nearbyStopIds?: string[];
}


export function MapView({
  parentStations,
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
  showRoadClosures = false,
  allVehicles = [],
  routesById,
  userLocation,
  locationPanOffsetY = 0,
  // serviceId is declared in the interface for future use
  // but is not consumed by the map component directly
  parentStationZoomTarget,
  onZoomComplete,
  selectedStop,
  onFlyToStop,
  highlightStopIds,
  nearbyStopIds
}: MapViewProps) {
  // Fetch road closures if enabled
  const { closures } = useRoadClosures(showRoadClosures);
  const { initialZoom, minZoom } = useGTFSMode();

  return (
    <SpiderfierProvider>
      <BaseMap
        userLocation={userLocation}
        locationPanOffsetY={locationPanOffsetY}
        {...(initialZoom !== undefined ? { zoom: initialZoom } : {})}
        {...(minZoom !== undefined ? { minZoom } : {})}
      >
        <SpiderfierManager />

        <ParentStationZoomController
          zoomTarget={parentStationZoomTarget}
          panOffsetY={parentStationZoomTarget?.panOffsetY ?? 0}
          onZoomComplete={onZoomComplete}
        />

        {selectedStop && onFlyToStop && (
          <OffScreenStopIndicator stop={selectedStop} onFlyTo={onFlyToStop} />
        )}

        {showAllVehicles && (
          <ZoomBasedStops
            parentStations={parentStations}
            platformStops={platformStops}
            parentChildCounts={parentChildCounts}
            selectedStopId={selectedStopId}
            highlightStopIds={highlightStopIds ?? (selectedRouteId ? routeStops : [])}
            nearbyStopIds={nearbyStopIds}
            orderedStops={orderedStops}
            routesById={routesById}
            onStopClick={onStopClick}
          />
        )}


        {showAllVehicles && (
          <AllVehicleMarkers vehicles={allVehicles} onVehicleClick={onVehicleClick} />
        )}

        <RoadClosures show={showRoadClosures} closures={closures} />

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
      </BaseMap>
    </SpiderfierProvider>
  );
}

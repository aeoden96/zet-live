import { useState, useCallback, useMemo } from 'react';
import { Search, X, Train } from 'lucide-react';
import { useSelectionParams } from '../hooks/useSelectionParams';
import type { DirectionFilter } from '../hooks/useSelectionParams';
import { MapView } from '../components/Map/MapView';
import { SearchModal } from '../components/common/SearchModal';
import { RouteModal } from '../components/common/RouteModal';
import { StopModal } from '../components/common/StopModal';
import { StopInfoBar } from '../components/common/StopInfoBar';
import { RouteInfoBar } from '../components/common/RouteInfoBar';
import { OnboardingWizard } from '../components/common/OnboardingWizard';
import { NearbyStopsModal } from '../components/common/NearbyStopsModal';
import { useInitialData } from '../hooks/useInitialData';
import { useCurrentService } from '../hooks/useCurrentService';
import { useRouteData } from '../hooks/useRouteData';
import { useGeolocation } from '../hooks/useGeolocation';
import { findNearestStops } from '../utils/gtfs';

const DATA_DIR = 'data-train';

export function TrainMode() {
  // Modal states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);

  // URL-backed selection state (route, stop, direction)
  const {
    selectedRouteId,
    selectedStopId,
    directionFilter,
    selectRoute,
    clearRoute,
    selectStop,
    clearStop,
  } = useSelectionParams();

  const [parentStationZoomTarget, setParentStationZoomTarget] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);
  const handleZoomComplete = useCallback(() => setParentStationZoomTarget(null), []);

  // Load train-specific initial data
  const {
    stops,
    routes,
    stopsById,
    routesById,
    groupedParentStations,
    calendar,
    loading: initialLoading,
    error: initialError,
  } = useInitialData({ dataDir: DATA_DIR });

  // All train stops are locationType=0 (no parent-station hierarchy)
  const platformStops = stops.filter(stop => stop.locationType === 0);
  const parentStations = stops.filter(stop => stop.locationType === 1);
  const parentChildCounts = new Map<string, number>();

  // Current service ID (workday / saturday / sunday)
  const serviceId = useCurrentService(calendar);

  // Load route-specific data
  const { shapes, routeStops, orderedStops, loading: routeLoading } = useRouteData(
    selectedRouteId,
    { dataDir: DATA_DIR }
  );

  const selectedRouteType = selectedRouteId ? (routesById.get(selectedRouteId)?.type ?? null) : null;

  // Handlers
  const handleSelectRoute = (routeId: string, _routeType: number, df?: DirectionFilter | 'all') => {
    const dir: DirectionFilter = df === 'A' || df === 'B' ? df : 'A';
    selectRoute(routeId, { dir });
    setSearchModalOpen(false);
    setRouteModalOpen(false);
    setStopModalOpen(false);
  };

  const handleStopClickFromMap = (stopId: string) => {
    if (stopId.startsWith('group-')) {
      const group = (groupedParentStations || []).find(g => g.id === stopId);
      if (group) {
        setParentStationZoomTarget({ lat: group.lat, lon: group.lon, zoom: 15 });
        const firstParentId = group.childIds[0];
        const childPlatform = stops.find(s => s.parentStation === firstParentId && s.locationType === 0);
        selectStop(childPlatform ? childPlatform.id : firstParentId);
      }
      return;
    }
    const stop = stopsById.get(stopId);
    if (stop && stop.locationType === 1) {
      setParentStationZoomTarget({ lat: stop.lat, lon: stop.lon, zoom: 17 });
      const childPlatform = stops.find(s => s.parentStation === stopId && s.locationType === 0);
      selectStop(childPlatform ? childPlatform.id : stopId);
    } else {
      selectStop(stopId);
    }
  };

  const handleExpandStop = (stopId: string) => {
    selectStop(stopId);
    setStopModalOpen(true);
  };

  const handleStopClickFromRoute = (stopId: string) => {
    selectStop(stopId);
    setRouteModalOpen(false);
  };

  const handleRouteClickFromStop = (routeId: string, _routeType: number) => {
    selectRoute(routeId);
    setStopModalOpen(false);
    setRouteModalOpen(false);
  };

  const handleExpandRoute = () => setRouteModalOpen(true);
  const handleCloseRoute   = () => setRouteModalOpen(false);
  const handleClearRoute   = () => clearRoute();

  const handleCloseStop = () => {
    setStopModalOpen(false);
    clearStop();
  };

  const handleCloseStopInfo = () => clearStop();

  const handleSelectStop = useCallback((stopId: string) => {
    setNearbyOpen(false);
    selectStop(stopId);
    const stop = stopsById.get(stopId);
    if (stop) setParentStationZoomTarget({ lat: stop.lat, lon: stop.lon, zoom: 15 });
  }, [selectStop, stopsById]);

  const onLocateSuccess = useCallback((_lat: number, _lon: number) => {
    clearStop();
    setNearbyOpen(true);
  }, [clearStop]);

  const { userLocation, setUserLocation, locateError } = useGeolocation(onLocateSuccess);

  const nearbyHighlightedStops = useMemo(() => {
    if (!nearbyOpen || !userLocation) return [];
    const nearby = findNearestStops(platformStops, userLocation.lat, userLocation.lon, 15);
    const seen = new Set<string>();
    return nearby.filter(s => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    }).slice(0, 6).map(s => s.id);
  }, [nearbyOpen, userLocation, platformStops]);

  const activeHighlightStopIds = useMemo(() => {
    return selectedRouteId && routeStops ? routeStops : [];
  }, [selectedRouteId, routeStops]);

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <div className="mt-4">Učitavanje podataka o vlakovima...</div>
        </div>
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="min-h-svh flex items-center justify-center p-4">
        <div className="alert alert-error max-w-md">
          <span>Greška pri učitavanju podataka: {initialError.message}</span>
        </div>
      </div>
    );
  }

  const selectedRoute = selectedRouteId ? routesById.get(selectedRouteId) : null;
  const selectedStop  = selectedStopId  ? stopsById.get(selectedStopId)   : null;

  return (
    <div className="h-svh w-screen overflow-hidden relative">
      {/* Full-screen map — no live vehicle markers for trains */}
      <MapView
        parentStations={parentStations}
        platformStops={platformStops}
        parentChildCounts={parentChildCounts}
        selectedRouteId={selectedRouteId}
        selectedStopId={selectedStopId}
        routeShapes={shapes}
        routeStops={routeStops}
        orderedStops={orderedStops}
        vehicles={[]}
        routeType={selectedRouteType}
        routeShortName={selectedRoute?.shortName}
        onStopClick={handleStopClickFromMap}
        showAllVehicles={true}
        showRoadClosures={false}
        allVehicles={[]}
        routesById={routesById}
        serviceId={serviceId}
        userLocation={userLocation}
        parentStationZoomTarget={parentStationZoomTarget}
        onZoomComplete={handleZoomComplete}
        selectedStop={selectedStop && !stopModalOpen ? selectedStop : null}
        onFlyToStop={selectedStop ? () => setParentStationZoomTarget({ lat: selectedStop.lat, lon: selectedStop.lon, zoom: 15 }) : undefined}
        highlightStopIds={activeHighlightStopIds}
        nearbyStopIds={nearbyHighlightedStops}
      />

      {/* Route loading indicator */}
      {routeLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="alert alert-info py-2 px-4 shadow-lg">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Učitavanje pruge...</span>
          </div>
        </div>
      )}

      {/* No-realtime notice */}
      <div className="absolute bottom-6 right-4 z-[1000]">
        <div className="badge badge-neutral gap-1.5 shadow text-[11px] opacity-80">
          <Train className="w-3 h-3" />
          Živopraćenje vlakova nije dostupno
        </div>
      </div>

      {/* Route Info Bar */}
      {selectedRoute && !routeModalOpen && !stopModalOpen && (
        <RouteInfoBar
          route={selectedRoute}
          vehicles={[]}
          orderedStops={orderedStops}
          stopsById={stopsById}
          onExpand={handleExpandRoute}
          onClose={handleClearRoute}
        />
      )}

      {/* Stop Info Bar */}
      {selectedStop && !stopModalOpen && (
        <StopInfoBar
          stop={selectedStop}
          routesById={routesById}
          stopsById={stopsById}
          onExpand={handleExpandStop}
          onClose={handleCloseStopInfo}
          onStopSelect={handleSelectStop}
          stackBelow={!!(selectedRoute && !routeModalOpen)}
          dataDir={DATA_DIR}
        />
      )}

      {/* Floating search bar */}
      <div className="absolute top-2 left-2 right-16 sm:left-4 sm:right-auto sm:top-4 z-[1000]">
        <div className="w-full sm:w-80 flex items-center gap-2 bg-base-100 rounded-xl px-4 py-3 shadow-lg">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <Search className="w-5 h-5 text-base-content/50 shrink-0" />
            {selectedRoute && routeModalOpen ? (
              <span className="text-sm flex-1">
                <span className="badge badge-error font-bold mr-2">{selectedRoute.shortName}</span>
                <span className="text-base-content/70">{selectedRoute.longName}</span>
              </span>
            ) : (
              <span className="text-base-content/50 text-sm flex-1">Pretraži vlakove...</span>
            )}
          </button>
          {selectedRoute && routeModalOpen && (
            <button
              onClick={handleClearRoute}
              className="btn btn-ghost btn-circle btn-xs min-h-[32px] min-w-[32px]"
              aria-label="Očisti odabir"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Locate error */}
      {locateError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1300]">
          <div className="alert alert-error py-2 px-4 shadow-lg text-xs max-w-72 text-center">
            <span>{locateError}</span>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        routes={routes}
        stops={stops}
        stopsById={stopsById}
        onSelectRoute={handleSelectRoute}
        onSelectStop={handleSelectStop}
      />

      {/* Route Modal */}
      {selectedRoute && (
        <RouteModal
          isOpen={routeModalOpen}
          route={selectedRoute}
          routeStops={routeStops}
          orderedStops={orderedStops}
          stopsById={stopsById}
          vehicles={[]}
          initialDirectionFilter={directionFilter}
          onClose={handleCloseRoute}
          onStopClick={handleStopClickFromRoute}
        />
      )}

      {/* Stop Modal */}
      {selectedStop && (
        <StopModal
          isOpen={stopModalOpen}
          stop={selectedStop}
          routesById={routesById}
          stopsById={stopsById}
          onClose={handleCloseStop}
          onRouteClick={handleRouteClickFromStop}
          onStopSelect={handleSelectStop}
          dataDir={DATA_DIR}
        />
      )}

      {/* Nearby Stops Modal */}
      {userLocation && (
        <NearbyStopsModal
          isOpen={nearbyOpen}
          userLat={userLocation.lat}
          userLon={userLocation.lon}
          stops={platformStops}
          onClose={() => {
            setNearbyOpen(false);
            setUserLocation(null);
          }}
          onSelectStop={handleSelectStop}
        />
      )}

      {/* Onboarding */}
      <OnboardingWizard variant="train" />
    </div>
  );
}

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useSelectionParams } from '../hooks/useSelectionParams';
import type { DirectionFilter } from '../hooks/useSelectionParams';
import { MapView } from '../components/Map/MapView';
import { SearchModal } from '../components/common/SearchModal';
import { RouteModal } from '../components/common/RouteModal';
import { StopModal } from '../components/common/StopModal';
import { StopInfoBar } from '../components/common/StopInfoBar';
import { RouteInfoBar } from '../components/common/RouteInfoBar';
import { DebugPanel } from '../components/common/DebugPanel';
import { OnboardingWizard } from '../components/common/OnboardingWizard';
import { NearbyStopsModal } from '../components/common/NearbyStopsModal';
import { ServiceAlerts } from '../components/common/ServiceAlerts';
import { useInitialData } from '../hooks/useInitialData';
import { useCurrentService } from '../hooks/useCurrentService';
import { useRouteData } from '../hooks/useRouteData';
import { useSettingsStore } from '../stores/settingsStore';
import { useRealtimeStore } from '../stores/realtimeStore';
import { useAllVehiclePositions } from '../hooks/useAllVehiclePositions';
import { useVehiclePositions } from '../hooks/useVehiclePositions';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { useGeolocation } from '../hooks/useGeolocation';

export function PublicTransportMode() {
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

  const showAllVehicles = useSettingsStore((s) => s.showAllVehicles);
  const showRoadClosures = useSettingsStore((s) => s.showRoadClosures);
  const { addRecentRoute, addRecentStop } = useSettingsStore();
  const [legendOpen, setLegendOpen] = useState(false);
  const [parentStationZoomTarget, setParentStationZoomTarget] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);

  const handleZoomComplete = useCallback(() => setParentStationZoomTarget(null), []);

  // Load initial data
  const {
    stops,
    routes,
    stopsById,
    routesById,
    groupedParentStations,
    calendar,
    loading: initialLoading,
    error: initialError
  } = useInitialData();

  // Separate parent stations and platform stops for zoom-based rendering
  const parentStations = stops.filter(stop => stop.locationType === 1);
  const platformStops = stops.filter(stop => stop.locationType === 0);

  // Calculate child stop counts for parent stations
  const parentChildCounts = new Map<string, number>();
  parentStations.forEach(parent => {
    const childCount = platformStops.filter(s => s.parentStation === parent.id).length;
    parentChildCounts.set(parent.id, childCount);
  });

  // Get current service ID
  const serviceId = useCurrentService(calendar);

  // Load route-specific data
  const { shapes, routeStops, orderedStops, activeTripsData, loading: routeLoading } = useRouteData(
    selectedRouteId
  );

  // Calculate vehicle positions
  const vehicles = useVehiclePositions(activeTripsData, serviceId);

  // Start polling the GTFS Realtime proxy worker (feeds realtimeStore)
  const { error: realtimeError, stats: realtimeStats } = useRealtimeData(showAllVehicles);
  const serviceAlerts = useRealtimeStore((s) => s.serviceAlerts);

  // Calculate all vehicle positions (when enabled)
  const { vehicles: allVehicles, loading: allVehiclesLoading } = useAllVehiclePositions(
    showAllVehicles,
    serviceId,
    routesById
  );

  // Derive route type from loaded data (no need to store separately)
  const selectedRouteType = selectedRouteId ? (routesById.get(selectedRouteId)?.type ?? null) : null;

  const onLocateSuccess = useCallback((lat: number, lon: number) => {
    setParentStationZoomTarget({ lat, lon, zoom: 16 });
    setNearbyOpen(true);
  }, []);

  const { userLocation, setUserLocation, locateError } = useGeolocation(onLocateSuccess);

  // Handlers
  const handleSelectRoute = (routeId: string, _routeType: number, df?: DirectionFilter | 'all') => {
    // Coerce 'all' (from SearchModal) to 'A'
    const dir: DirectionFilter = df === 'A' || df === 'B' ? df : 'A';
    selectRoute(routeId, { dir });
    setSearchModalOpen(false);
    addRecentRoute(routeId);
    // Default to small route info bar; user can expand to full RouteModal
    setRouteModalOpen(false);
    setStopModalOpen(false);
  };

  const handleStopClickFromMap = (stopId: string) => {
    // Handle clustered group clicks (ids prefixed with "group-")
    if (stopId.startsWith('group-')) {
      const group = (groupedParentStations || []).find(g => g.id === stopId);
      if (group) {
        // Zoom to level where group splits into real parent stations
        setParentStationZoomTarget({ lat: group.lat, lon: group.lon, zoom: 15 });

        // Select first platform under the first parent in the group (if available)
        const firstParentId = group.childIds[0];
        const childPlatform = stops.find(s => s.parentStation === firstParentId && s.locationType === 0);
        selectStop(childPlatform ? childPlatform.id : firstParentId);
      }
      return;
    }

    const stop = stopsById.get(stopId);
    if (stop && stop.locationType === 1) {
      // Parent station clicked - trigger zoom
      setParentStationZoomTarget({ lat: stop.lat, lon: stop.lon, zoom: 17 });

      const childPlatform = stops.find(
        (s) => s.parentStation === stopId && s.locationType === 0
      );
      selectStop(childPlatform ? childPlatform.id : stopId);
    } else {
      selectStop(stopId);
      addRecentStop(stopId);
    }
  };

  const handleExpandStop = (stopId: string) => {
    const stop = stopsById.get(stopId);
    if (stop && stop.locationType === 1) {
      const childPlatform = stops.find(
        (s) => s.parentStation === stopId && s.locationType === 0
      );
      selectStop(childPlatform ? childPlatform.id : stopId);
    } else {
      selectStop(stopId);
    }
    addRecentStop(stopId);
    setStopModalOpen(true);
  };

  const handleStopClickFromRoute = (stopId: string) => {
    selectStop(stopId);
    setRouteModalOpen(false);
    // Keep stopModalOpen false — stop appears as small StopInfoBar below the RouteInfoBar
  };

  const handleRouteClickFromStop = (routeId: string, _routeType: number) => {
    selectRoute(routeId);
    setStopModalOpen(false);
    // Default to small route info bar
    setRouteModalOpen(false);
  };

  const handleExpandRoute = () => {
    setRouteModalOpen(true);
  };

  const handleCloseRoute = () => {
    setRouteModalOpen(false);
    // Keep route selected when closing modal
  };

  const handleClearRoute = () => {
    clearRoute();
  };

  const handleCloseStop = () => {
    setStopModalOpen(false);
    clearStop();
  };

  const handleSelectStop = (stopId: string) => {
    const stop = stopsById.get(stopId);
    selectStop(stopId);
    addRecentStop(stopId);
    if (stop) {
      setParentStationZoomTarget({ lat: stop.lat, lon: stop.lon, zoom: 17 });
    }
  };



  const handleCloseStopInfo = () => {
    clearStop();
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <div className="mt-4">Učitavanje podataka...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="alert alert-error max-w-md">
          <span>Greška pri učitavanju podataka: {initialError.message}</span>
        </div>
      </div>
    );
  }

  const selectedRoute = selectedRouteId ? routesById.get(selectedRouteId) : null;
  const selectedStop = selectedStopId ? stopsById.get(selectedStopId) : null;

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Full-screen map */}
      <MapView
        parentStations={parentStations}
        groupedParentStations={groupedParentStations}
        platformStops={platformStops}
        parentChildCounts={parentChildCounts}
        selectedRouteId={selectedRouteId}
        selectedStopId={selectedStopId}
        routeShapes={shapes}
        routeStops={routeStops}
        orderedStops={orderedStops}
        vehicles={vehicles}
        routeType={selectedRouteType}
        routeShortName={selectedRoute?.shortName}
        onStopClick={handleStopClickFromMap}
        onVehicleClick={(routeId, routeType) => handleSelectRoute(routeId, routeType)}
        showAllVehicles={showAllVehicles}
        showRoadClosures={showRoadClosures}
        allVehicles={showAllVehicles && selectedRouteId ? allVehicles.filter(v => v.routeId === selectedRouteId) : allVehicles}
        routesById={routesById}
        serviceId={serviceId}
        userLocation={userLocation}
        parentStationZoomTarget={parentStationZoomTarget}
        onZoomComplete={handleZoomComplete}
        selectedStop={selectedStop && !stopModalOpen ? selectedStop : null}
        onFlyToStop={selectedStop ? () => setParentStationZoomTarget({ lat: selectedStop.lat, lon: selectedStop.lon, zoom: 17 }) : undefined}
      />

      {/* Loading indicators */}
      {routeLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="alert alert-info py-2 px-4 shadow-lg">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Učitavanje rute...</span>
          </div>
        </div>
      )}
      {allVehiclesLoading && (
        <div className="absolute bottom-6 left-4 z-[1000] flex items-center gap-2 bg-base-100/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md text-xs text-base-content/70 pointer-events-none">
          <span className="loading loading-spinner loading-xs"></span>
          <span>Učitavanje vozila...</span>
        </div>
      )}

      {/* Realtime status badge */}
      {realtimeError && (
        <div className="absolute top-16 right-2 sm:right-4 z-[1000]">
          <div className="alert alert-error py-2 px-4 shadow-lg text-xs max-w-64">
            <span>GPS uživo: {realtimeError.message}</span>
          </div>
        </div>
      )}
      {showAllVehicles && realtimeStats && !realtimeError && (
        <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-end gap-2">
          {/* Service Alerts */}
          <ServiceAlerts
            alerts={serviceAlerts}
            routesById={routesById}
            selectedRouteId={selectedRouteId}
            onRouteClick={(routeId, routeType) => handleSelectRoute(routeId, routeType)}
          />

          {/* Legend popup */}
          {legendOpen && (
            <div className="bg-base-100 rounded-xl shadow-xl border border-base-200 p-3 w-52 text-xs space-y-2">
              <p className="font-semibold text-base-content mb-1">Legenda</p>

              {/* Tram */}
              <div className="flex items-center gap-2">
                <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
                  <svg style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(0deg)', transformOrigin: '11px 11px' }} width="22" height="22" viewBox="0 0 22 22">
                    <polygon points="11,1 8,6 14,6" fill="#2337ff" stroke="white" strokeWidth="1" strokeLinejoin="round" />
                  </svg>
                  <svg style={{ position: 'absolute', top: 0, left: 0 }} width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="7" fill="#2337ff" fillOpacity="0.95" stroke="white" strokeWidth="2" />
                    <text x="11" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" fontFamily="system-ui,sans-serif">T1</text>
                  </svg>
                </div>
                <span className="text-base-content/80">Tramvaj (GPS, smjer poznat)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="7" fill="#2337ff" fillOpacity="0.85" stroke="white" strokeWidth="2" />
                  <text x="10" y="13" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" fontFamily="system-ui,sans-serif">T1</text>
                </svg>
                <span className="text-base-content/80">Tramvaj (u mirovanju)</span>
              </div>

              <div className="divider my-0.5" />

              {/* Bus */}
              <div className="flex items-center gap-2">
                <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
                  <svg style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(45deg)', transformOrigin: '11px 11px' }} width="22" height="22" viewBox="0 0 22 22">
                    <polygon points="11,1 8,6 14,6" fill="#ff6b35" stroke="white" strokeWidth="1" strokeLinejoin="round" />
                  </svg>
                  <svg style={{ position: 'absolute', top: 0, left: 0 }} width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="7" fill="#ff6b35" fillOpacity="0.95" stroke="white" strokeWidth="2" />
                    <text x="11" y="14" textAnchor="middle" fontSize="6" fontWeight="bold" fill="white" fontFamily="system-ui,sans-serif">109</text>
                  </svg>
                </div>
                <span className="text-base-content/80">Autobus (GPS, smjer poznat)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="7" fill="#ff6b35" fillOpacity="0.85" stroke="white" strokeWidth="2" />
                  <text x="10" y="13" textAnchor="middle" fontSize="6" fontWeight="bold" fill="white" fontFamily="system-ui,sans-serif">109</text>
                </svg>
                <span className="text-base-content/80">Autobus (u mirovanju)</span>
              </div>

              <div className="divider my-0.5" />

              {/* Stops */}
              <div className="flex items-center gap-2">
                <div style={{ position: 'relative', width: 18, height: 18, flexShrink: 0 }}>
                  <svg style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(45deg)', transformOrigin: '9px 9px' }} width="18" height="18" viewBox="0 0 18 18">
                    <polygon points="9,1 6,4 12,4" fill="#2563eb" stroke="white" strokeWidth="1" strokeLinejoin="round" />
                  </svg>
                  <svg style={{ position: 'absolute', top: 0, left: 0 }} width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="5" fill="#2563eb" fillOpacity="0.9" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="text-base-content/80">Tramvajska stanica</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ position: 'relative', width: 18, height: 18, flexShrink: 0 }}>
                  <svg style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(0deg)', transformOrigin: '9px 9px' }} width="18" height="18" viewBox="0 0 18 18">
                    <polygon points="9,1 6,4 12,4" fill="#ea580c" stroke="white" strokeWidth="1" strokeLinejoin="round" />
                  </svg>
                  <svg style={{ position: 'absolute', top: 0, left: 0 }} width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="5" fill="#ea580c" fillOpacity="0.9" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="text-base-content/80">Autobusna stanica</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <circle cx="9" cy="9" r="5" fill="#8242be" fillOpacity="0.9" stroke="white" strokeWidth="1.5" />
                </svg>
                <span className="text-base-content/80">Mješovita stanica</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <circle cx="9" cy="9" r="7" fill="#ff6b6b" fillOpacity="1" stroke="white" strokeWidth="2" />
                </svg>
                <span className="text-base-content/80">Odabrana stanica</span>
              </div>
            </div>
          )}

          {/* Badge button */}
          <button
            className="badge badge-success gap-1 shadow cursor-pointer hover:badge-outline transition-all"
            onClick={() => setLegendOpen((o) => !o)}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            {realtimeStats.vehiclePositions} vozila uživo
          </button>
        </div>
      )}

      {/* Route Info Bar (when route selected but full modal not open) */}
      {selectedRoute && !routeModalOpen && !stopModalOpen && (
        <RouteInfoBar
          route={selectedRoute}
          vehicles={vehicles}
          orderedStops={orderedStops}
          stopsById={stopsById}
          onExpand={handleExpandRoute}
          onClose={handleClearRoute}
        />
      )}

      {/* Stop Info Bar (when stop selected but modal not open) */}
      {selectedStop && !stopModalOpen && (
        <StopInfoBar
          stop={selectedStop}
          routesById={routesById}
          stopsById={stopsById}
          onExpand={handleExpandStop}
          onClose={handleCloseStopInfo}
          stackBelow={!!(selectedRoute && !routeModalOpen)}
        />
      )}

      {/* Floating search bar */}
      {showAllVehicles && (
        <div className="absolute top-2 left-2 right-2 sm:left-4 sm:right-auto sm:top-4 z-[1000]">
          <div className="w-full sm:w-80 flex items-center gap-2 bg-base-100 rounded-xl px-4 py-3 shadow-lg">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
            >
              <Search className="w-5 h-5 text-base-content/50 shrink-0" />
              {selectedRoute && routeModalOpen ? (
                <span className="text-sm flex-1">
                  <span className={`badge ${selectedRoute.type === 0 ? 'badge-primary' : 'badge-accent'} font-bold mr-2`}>
                    {selectedRoute.shortName}
                  </span>
                  <span className="text-base-content/70">{selectedRoute.longName}</span>
                </span>
              ) : (
                <span className="text-base-content/50 text-sm flex-1">Pretraži linije...</span>
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
      )}


      {/* Locate error toast */}
      {locateError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1300]">
          <div className="alert alert-error py-2 px-4 shadow-lg text-xs max-w-72 text-center">
            <span>{locateError}</span>
          </div>
        </div>
      )}

      {/* Debug panel */}
      <DebugPanel />

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
          vehicles={vehicles}
          initialDirectionFilter={directionFilter}
          onClose={handleCloseRoute}
          onStopClick={handleStopClickFromRoute}
        />
      )}

      {/* Stop Modal (full-screen) */}
      {selectedStop && (
        <StopModal
          isOpen={stopModalOpen}
          stop={selectedStop}
          routesById={routesById}
          stopsById={stopsById}
          onClose={handleCloseStop}
          onRouteClick={handleRouteClickFromStop}
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

      {/* Onboarding Wizard */}
      <OnboardingWizard />
    </div>
  );
}


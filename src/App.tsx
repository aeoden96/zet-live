import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Settings, Search, X } from 'lucide-react';
import { MapView } from './components/Map/MapView';
import { SearchModal } from './components/common/SearchModal';
import { RouteModal } from './components/common/RouteModal';
import { StopModal } from './components/common/StopModal';
import { StopInfoBar } from './components/common/StopInfoBar';
import { TimeDisplay } from './components/common/TimeDisplay';
import { DebugPanel } from './components/common/DebugPanel';
import { OnboardingModal } from './components/common/OnboardingModal';
import { useInitialData } from './hooks/useInitialData';
import { useCurrentService } from './hooks/useCurrentService';
import { useRouteData } from './hooks/useRouteData';
import { useStopDepartures } from './hooks/useStopDepartures';
import { useVehiclePositions } from './hooks/useVehiclePositions';
import { useAllVehiclePositions } from './hooks/useAllVehiclePositions';
import { useRealtimeData } from './hooks/useRealtimeData';

type DirectionFilter = 'A' | 'B';

function App() {
  // Modal states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);

  // Selection states
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<number | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('A');
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [parentStationZoomTarget, setParentStationZoomTarget] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);

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
  const { error: realtimeError, stats: realtimeStats } = useRealtimeData();

  // Calculate all vehicle positions (when enabled)
  const { vehicles: allVehicles, loading: allVehiclesLoading } = useAllVehiclePositions(
    showAllVehicles,
    serviceId,
    routesById
  );

  // Load stop departures
  const { departures } = useStopDepartures(selectedStopId);

  // Handlers
  const handleSelectRoute = (routeId: string, routeType: number, df?: DirectionFilter | 'all') => {
    setSelectedRouteId(routeId);
    setSelectedRouteType(routeType);
    // Coerce 'all' (from SearchModal) to 'A'
    if (df === 'A' || df === 'B') setDirectionFilter(df);
    else setDirectionFilter('A');
    setSearchModalOpen(false);
    setRouteModalOpen(true);
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
        setSelectedStopId(childPlatform ? childPlatform.id : firstParentId);
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
      if (childPlatform) {
        setSelectedStopId(childPlatform.id);
      } else {
        setSelectedStopId(stopId);
      }
    } else {
      setSelectedStopId(stopId);
    }
    // Show fixed stop info bar at top
  };

  const handleExpandStop = (stopId: string) => {
    const stop = stopsById.get(stopId);
    if (stop && stop.locationType === 1) {
      const childPlatform = stops.find(
        (s) => s.parentStation === stopId && s.locationType === 0
      );
      setSelectedStopId(childPlatform ? childPlatform.id : stopId);
    } else {
      setSelectedStopId(stopId);
    }
    setStopModalOpen(true);
  };

  const handleStopClickFromRoute = (stopId: string) => {
    setSelectedStopId(stopId);
    setRouteModalOpen(false);
    setStopModalOpen(true);
  };

  const handleRouteClickFromStop = (routeId: string, routeType: number) => {
    setSelectedRouteId(routeId);
    setSelectedRouteType(routeType);
    setStopModalOpen(false);
    setRouteModalOpen(true);
  };

  const handleCloseRoute = () => {
    setRouteModalOpen(false);
    // Keep route selected when closing modal
  };

  const handleClearRoute = () => {
    setSelectedRouteId(null);
    setSelectedRouteType(null);
    setDirectionFilter('A');
  };

  const handleCloseStop = () => {
    setStopModalOpen(false);
    setSelectedStopId(null);
  };

  const handleCloseStopInfo = () => {
    setSelectedStopId(null);
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
        vehicles={vehicles}
        routeType={selectedRouteType}
        onStopClick={handleStopClickFromMap}
        showAllVehicles={showAllVehicles}
        allVehicles={allVehicles}
        routesById={routesById}
        serviceId={serviceId}
        parentStationZoomTarget={parentStationZoomTarget}
        onZoomComplete={() => setParentStationZoomTarget(null)}
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
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="alert alert-info py-2 px-4 shadow-lg">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Učitavanje svih vozila...</span>
          </div>
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
      {realtimeStats && !realtimeError && (
        <div className="absolute top-16 right-2 sm:right-4 z-[1000]">
          <div className="badge badge-success gap-1 shadow">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            {realtimeStats.vehiclePositions} vozila uživo
          </div>
        </div>
      )}

      {/* Stop Info Bar (when stop selected but modal not open) */}
      {selectedStop && !stopModalOpen && (
        <StopInfoBar
          stop={selectedStop}
          routesById={routesById}
          serviceId={serviceId}
          onExpand={handleExpandStop}
          onClose={handleCloseStopInfo}
        />
      )}

      {/* Floating search bar */}
      <div className="absolute top-2 left-2 right-2 sm:left-4 sm:right-auto sm:top-4 z-[1000]">
        <div className="w-full sm:w-80 flex items-center gap-2 bg-base-100 rounded-xl px-4 py-3 shadow-lg">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <Search className="w-5 h-5 text-base-content/50 shrink-0" />
            {selectedRoute ? (
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
          {selectedRoute && (
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

      {/* Map controls (top-right) */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[1000] flex flex-col items-end gap-2">
        <div className="bg-base-100 rounded-lg px-3 py-2 shadow-lg hidden sm:block">
          <TimeDisplay serviceId={serviceId} calendar={calendar} />
        </div>
        <Link to="/settings" className="btn btn-circle btn-sm sm:btn-md min-h-[40px] min-w-[40px] shadow-lg">
          <Settings className="w-5 h-5" />
        </Link>
        <button
          onClick={() => setShowAllVehicles(!showAllVehicles)}
          className={`btn btn-circle btn-sm sm:btn-md min-h-[40px] min-w-[40px] shadow-lg ${
            showAllVehicles ? 'btn-primary' : ''
          }`}
          aria-label="Toggle all vehicles"
          title={showAllVehicles ? 'Sakrij sva vozila' : 'Prikaži sva vozila'}
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* Debug panel */}
      <DebugPanel />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        routes={routes}
        onSelectRoute={handleSelectRoute}
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
          departures={departures}
          routesById={routesById}
          serviceId={serviceId}
          onClose={handleCloseStop}
          onRouteClick={handleRouteClickFromStop}
        />
      )}

      {/* Onboarding Modal */}
      <OnboardingModal />
    </div>
  );
}

export default App;

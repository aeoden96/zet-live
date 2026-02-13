import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Settings, Search } from 'lucide-react';
import { MapView } from './components/Map/MapView';
import { SearchModal } from './components/common/SearchModal';
import { RouteModal } from './components/common/RouteModal';
import { StopModal } from './components/common/StopModal';
import { TimeDisplay } from './components/common/TimeDisplay';
import { DebugPanel } from './components/common/DebugPanel';
import { OnboardingModal } from './components/common/OnboardingModal';
import { useInitialData } from './hooks/useInitialData';
import { useCurrentService } from './hooks/useCurrentService';
import { useRouteData } from './hooks/useRouteData';
import { useStopDepartures } from './hooks/useStopDepartures';
import { useVehiclePositions } from './hooks/useVehiclePositions';
import { useAllVehiclePositions } from './hooks/useAllVehiclePositions';

type DirectionFilter = 'all' | 'A' | 'B';

function App() {
  // Modal states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);

  // Selection states
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<number | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [showAllVehicles, setShowAllVehicles] = useState(false);

  // Load initial data
  const { 
    stops,
    routes, 
    stopsById, 
    routesById, 
    calendar, 
    loading: initialLoading,
    error: initialError
  } = useInitialData();

  // Separate parent stations and platform stops for zoom-based rendering
  const parentStations = stops.filter(stop => stop.locationType === 1);
  const platformStops = stops.filter(stop => stop.locationType === 0);

  // Get current service ID
  const serviceId = useCurrentService(calendar);

  // Load route-specific data
  const { shapes, routeStops, activeTripsData, loading: routeLoading } = useRouteData(
    selectedRouteId
  );

  // Calculate vehicle positions
  const vehicles = useVehiclePositions(activeTripsData, serviceId);

  // Calculate all vehicle positions (when enabled)
  const { vehicles: allVehicles, loading: allVehiclesLoading } = useAllVehiclePositions(
    showAllVehicles,
    serviceId
  );

  // Load stop departures
  const { departures } = useStopDepartures(selectedStopId);

  // Handlers
  const handleSelectRoute = (routeId: string, routeType: number, df?: DirectionFilter) => {
    setSelectedRouteId(routeId);
    setSelectedRouteType(routeType);
    if (df) setDirectionFilter(df);
    setSearchModalOpen(false);
    setRouteModalOpen(true);
  };

  const handleStopClickFromMap = (stopId: string) => {
    const stop = stopsById.get(stopId);
    if (stop && stop.locationType === 1) {
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
    // Don't open modal - just select on map; popup will show timetable
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
    setSelectedRouteId(null);
    setSelectedRouteType(null);
  };

  const handleCloseStop = () => {
    setStopModalOpen(false);
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
        platformStops={platformStops}
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
        onExpandStop={handleExpandStop}
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

      {/* Floating search bar */}
      <div className="absolute top-2 left-2 right-2 sm:left-4 sm:right-auto sm:top-4 z-[1000]">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="w-full sm:w-80 flex items-center gap-3 bg-base-100 rounded-xl px-4 py-3 shadow-lg hover:shadow-xl transition-shadow text-left"
        >
          <Search className="w-5 h-5 text-base-content/50 shrink-0" />
          <span className="text-base-content/50 text-sm flex-1">Pretraži linije...</span>
          {selectedRoute && (
            <span className={`badge ${selectedRoute.type === 0 ? 'badge-primary' : 'badge-accent'} font-bold`}>
              {selectedRoute.shortName}
            </span>
          )}
        </button>
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

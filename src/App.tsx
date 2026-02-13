import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { MapView } from './components/Map/MapView';
import { Sidebar } from './components/Sidebar/Sidebar';
import { BottomSheet } from './components/common/BottomSheet';
import { RouteList } from './components/Sidebar/RouteList';
import { RoutePanel } from './components/Sidebar/RoutePanel';
import { StopPanel } from './components/Sidebar/StopPanel';
import { ThemeToggle } from './components/common/ThemeToggle';
import { TimeDisplay } from './components/common/TimeDisplay';
import { DebugPanel } from './components/common/DebugPanel';
import { useInitialData } from './hooks/useInitialData';
import { useCurrentService } from './hooks/useCurrentService';
import { useRouteData } from './hooks/useRouteData';
import { useStopDepartures } from './hooks/useStopDepartures';
import { useVehiclePositions } from './hooks/useVehiclePositions';
import { useAllVehiclePositions } from './hooks/useAllVehiclePositions';

type ViewMode = 'list' | 'route' | 'stop';
type DirectionFilter = 'all' | 'A' | 'B';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<number | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllVehicles, setShowAllVehicles] = useState(false);

  // Load initial data
  const { 
    stops,
    routes, 
    parentStations, 
    stopsById, 
    routesById, 
    calendar, 
    loading: initialLoading,
    error: initialError
  } = useInitialData();

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
  const handleSelectRoute = (routeId: string, routeType: number, directionFilter?: DirectionFilter) => {
    setSelectedRouteId(routeId);
    setSelectedRouteType(routeType);
    if (directionFilter) {
      setDirectionFilter(directionFilter);
    }
    setViewMode('route');
  };

  const handleSelectStop = (stopId: string) => {
    const stop = stopsById.get(stopId);
    
    // If it's a parent station, find the first child platform
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
    setViewMode('stop');
  };

  const handleBack = () => {
    if (viewMode === 'stop') {
      // If we came from a route view, go back to route
      if (selectedRouteId) {
        setViewMode('route');
      } else {
        setViewMode('list');
      }
      setSelectedStopId(null);
    } else if (viewMode === 'route') {
      setViewMode('list');
      setSelectedRouteId(null);
      setSelectedRouteType(null);
    }
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

  // Sidebar content component
  const sidebarContent = (
    <>
      {viewMode === 'list' && (
        <RouteList 
          routes={routes} 
          onSelectRoute={handleSelectRoute}
        />
      )}
      
      {viewMode === 'route' && selectedRoute && (
        <RoutePanel
          route={selectedRoute}
          routeStops={routeStops}
          stopsById={stopsById}
          vehicles={vehicles}
          initialDirectionFilter={directionFilter}
          onBack={handleBack}
          onStopClick={handleSelectStop}
        />
      )}
      
      {viewMode === 'stop' && selectedStop && (
        <StopPanel
          stop={selectedStop}
          departures={departures}
          routesById={routesById}
          serviceId={serviceId}
          onBack={handleBack}
          onRouteClick={handleSelectRoute}
        />
      )}
    </>
  );

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Desktop Sidebar (lg+) */}
      <div className="hidden lg:block">
        <Sidebar isOpen={true} onClose={() => {}}>
          {sidebarContent}
        </Sidebar>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {routeLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="alert alert-info">
              <span className="loading loading-spinner loading-sm"></span>
              <span>Učitavanje rute...</span>
            </div>
          </div>
        )}
        
        {allVehiclesLoading && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="alert alert-info">
              <span className="loading loading-spinner loading-sm"></span>
              <span>Učitavanje svih vozila...</span>
            </div>
          </div>
        )}
        
        <MapView
          stops={parentStations}
          selectedRouteId={selectedRouteId}
          selectedStopId={selectedStopId}
          routeShapes={shapes}
          routeStops={routeStops}
          vehicles={vehicles}
          routeType={selectedRouteType}
          onStopClick={handleSelectStop}
          showAllVehicles={showAllVehicles}
          allVehicles={allVehicles}
        />

        {/* Map controls */}
        <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-[1000] flex flex-col gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowAllVehicles(!showAllVehicles)}
            className={`btn btn-circle min-h-[44px] min-w-[44px] p-2 ${
              showAllVehicles ? 'btn-primary' : ''
            }`}
            aria-label="Toggle all vehicles"
            title={showAllVehicles ? 'Sakrij sva vozila' : 'Prikaži sva vozila'}
          >
            <MapPin className="w-6 h-6" />
          </button>
          <div className="bg-base-100 rounded-lg px-3 py-2 lg:p-3 shadow-lg">
            <TimeDisplay serviceId={serviceId} calendar={calendar} />
          </div>
        </div>

        {/* Debug panel */}
        <DebugPanel />
      </div>

      {/* Mobile Bottom Sheet (< lg) */}
      <BottomSheet isOpen={true} onClose={() => {}}>
        {sidebarContent}
      </BottomSheet>
    </div>
  );
}

export default App;

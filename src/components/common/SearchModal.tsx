/**
 * Search modal - replaces sidebar/drawer for route browsing
 * Opens from the floating search bar on the map
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, TrainFront, Bus } from 'lucide-react';
import type { Route } from '../../utils/gtfs';
import { isRouteTypeTram, isRouteTypeBus } from '../../utils/gtfs';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: Route[];
  onSelectRoute: (routeId: string, routeType: number, directionFilter?: 'A' | 'B') => void;
}

type FilterType = 'tram' | 'bus';

export function SearchModal({ isOpen, onClose, routes, onSelectRoute }: SearchModalProps) {
  const [filter, setFilter] = useState<FilterType>('tram');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Split routes by type
  const { trams, buses } = useMemo(() => {
    return routes.reduce(
      (acc, route) => {
        if (isRouteTypeTram(route.type)) acc.trams.push(route);
        else if (isRouteTypeBus(route.type)) acc.buses.push(route);
        return acc;
      },
      { trams: [] as Route[], buses: [] as Route[] }
    );
  }, [routes]);

  // Popular routes for quick access
  const popularTrams = ['6', '11', '17', '4', '13', '12'];
  const popularBuses = ['101', '102', '106', '140', '268'];

  const quickAccessRoutes = useMemo(() => {
    const popular = filter === 'tram' ? popularTrams : popularBuses;
    return popular
      .map(id => routes.find(r => r.shortName === id))
      .filter((r): r is Route => r !== undefined);
  }, [filter, routes]);

  // Filter routes
  const filteredRoutes = useMemo(() => {
    const sourceRoutes = filter === 'tram' ? trams : buses;
    if (!searchQuery.trim()) return sourceRoutes;

    const query = searchQuery.toLowerCase();
    return sourceRoutes.filter(
      (route) =>
        route.shortName.toLowerCase().includes(query) ||
        route.longName.toLowerCase().includes(query)
    );
  }, [filter, searchQuery, trams, buses]);

  const handleSelectRoute = (route: Route) => {
    onSelectRoute(route.id, route.type, "A");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'backdrop-fade-in 0.15s ease-out' }} onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-2 mt-2 sm:mt-8 max-h-[90vh] bg-base-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ animation: 'modal-fade-in 0.2s ease-out' }}>
        {/* Header / Search */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold flex-1">Pretraži linije</h2>
            <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Broj ili naziv linije..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10 min-h-[44px] text-base"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2">
            <div className="tabs tabs-boxed flex-1">
              <button
                className={`tab flex-1 min-h-[40px] gap-1 ${filter === 'tram' ? 'tab-active' : ''}`}
                onClick={() => setFilter('tram')}
              >
                <TrainFront className="w-4 h-4" />
                Tramvaji ({trams.length})
              </button>
              <button
                className={`tab flex-1 min-h-[40px] gap-1 ${filter === 'bus' ? 'tab-active' : ''}`}
                onClick={() => setFilter('bus')}
              >
                <Bus className="w-4 h-4" />
                Autobusi ({buses.length})
              </button>
            </div>
          </div>

          {/* Quick access */}
          {!searchQuery && quickAccessRoutes.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-base-content/60 mb-1.5">Brzi pristup:</div>
              <div className="flex flex-wrap gap-2">
                {quickAccessRoutes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => handleSelectRoute(route)}
                    className={`badge ${
                      filter === 'tram' ? 'badge-primary' : 'badge-accent'
                    } badge-lg font-bold hover:opacity-80 transition-opacity cursor-pointer`}
                  >
                    {route.shortName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {filteredRoutes.length === 0 ? (
            <div className="p-8 text-center text-base-content/50">
              {searchQuery ? 'Nema rezultata' : 'Nema linija'}
            </div>
          ) : (
            <div className="divide-y divide-base-300">
              {filteredRoutes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => handleSelectRoute(route)}
                  className="w-full py-3 px-4 text-left hover:bg-base-200 active:bg-base-300 transition-colors min-h-[52px]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`badge ${
                        filter === 'tram' ? 'badge-primary' : 'badge-accent'
                      } font-bold min-w-[3rem] justify-center`}
                    >
                      {route.shortName}
                    </div>
                    <div className="text-sm">{route.longName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Route list with search and filtering
 */

import { useState, useMemo } from 'react';
import type { Route } from '../../utils/gtfs';
import { isRouteTypeTram, isRouteTypeBus } from '../../utils/gtfs';
import { Search } from 'lucide-react';

interface RouteListProps {
  routes: Route[];
  onSelectRoute: (routeId: string, routeType: number, directionFilter?: 'all' | 'A' | 'B') => void;
}

type FilterType = 'tram' | 'bus';

type DirectionFilter = 'all' | 'A' | 'B';

const POPULAR_TRAMS = ['6', '11', '17', '4', '13', '12'];
const POPULAR_BUSES = ['101', '102', '106', '140', '268'];

export function RouteList({ routes, onSelectRoute }: RouteListProps) {
  const [filter, setFilter] = useState<FilterType>('tram');
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');

  // Split routes by type
  const { trams, buses } = useMemo(() => {
    return routes.reduce(
      (acc, route) => {
        if (isRouteTypeTram(route.type)) {
          acc.trams.push(route);
        } else if (isRouteTypeBus(route.type)) {
          acc.buses.push(route);
        }
        return acc;
      },
      { trams: [] as Route[], buses: [] as Route[] }
    );
  }, [routes]);

  // Popular routes for quick access
  const quickAccessRoutes = useMemo(() => {
    const popular = filter === 'tram' ? POPULAR_TRAMS : POPULAR_BUSES;
    return popular
      .map(id => routes.find(r => r.shortName === id))
      .filter((r): r is Route => r !== undefined);
  }, [filter, routes]);

  // Filter routes based on current tab and search
  const filteredRoutes = useMemo(() => {
    const sourceRoutes = filter === 'tram' ? trams : buses;
    
    if (!searchQuery.trim()) {
      return sourceRoutes;
    }

    const query = searchQuery.toLowerCase();
    return sourceRoutes.filter(
      (route) =>
        route.shortName.toLowerCase().includes(query) ||
        route.longName.toLowerCase().includes(query)
    );
  }, [filter, searchQuery, trams, buses]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <h1 className="text-2xl font-bold mb-4">ZET Live</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
          <input
            type="text"
            placeholder="Pretraži linije..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10 min-h-[44px] text-base"
          />
        </div>

        {/* Tabs with direction filter */}
        <div className="flex items-center gap-2">
          <div className="tabs tabs-boxed flex-1">
            <button
              className={`tab flex-1 min-h-[44px] px-4 lg:px-6 ${filter === 'tram' ? 'tab-active' : ''}`}
              onClick={() => setFilter('tram')}
            >
              Tramvaji ({trams.length})
            </button>
            <button
              className={`tab flex-1 min-h-[44px] px-4 lg:px-6 ${filter === 'bus' ? 'tab-active' : ''}`}
              onClick={() => setFilter('bus')}
            >
              Autobusi ({buses.length})
            </button>
          </div>
          
          {/* Direction filter switches */}
          <div className="flex gap-1">
            <button
              className={`btn btn-sm btn-circle min-h-[44px] min-w-[44px] ${
                directionFilter === 'all' ? 'btn-neutral' : 'btn-ghost'
              }`}
              onClick={() => setDirectionFilter('all')}
              title="Svi smjerovi"
            >
              •
            </button>
            <button
              className={`btn btn-sm btn-circle min-h-[44px] min-w-[44px] ${
                directionFilter === 'A' ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => setDirectionFilter('A')}
              title="Smjer A (1,3,5...)"
            >
              A
            </button>
            <button
              className={`btn btn-sm btn-circle min-h-[44px] min-w-[44px] ${
                directionFilter === 'B' ? 'btn-secondary' : 'btn-ghost'
              }`}
              onClick={() => setDirectionFilter('B')}
              title="Smjer B (2,4,6...)"
            >
              B
            </button>
          </div>
        </div>

        {/* Quick access */}
        {quickAccessRoutes.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-base-content/60 mb-2">Brzi pristup:</div>
            <div className="flex flex-wrap gap-2">
              {quickAccessRoutes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => onSelectRoute(route.id, route.type)}
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
      <div className="flex-1 overflow-y-auto">
        {filteredRoutes.length === 0 ? (
          <div className="p-4 text-center text-base-content/50">
            {searchQuery ? 'Nema rezultata' : 'Nema linija'}
          </div>
        ) : (
          <div className="divide-y divide-base-300">
            {filteredRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id, route.type, directionFilter)}
                className="w-full py-3 px-4 lg:p-4 text-left hover:bg-base-200 transition-colors min-h-[56px]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`badge ${
                      filter === 'tram' ? 'badge-primary' : 'badge-accent'
                    } font-bold`}
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
  );
}

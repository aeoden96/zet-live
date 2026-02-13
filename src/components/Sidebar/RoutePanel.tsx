/**
 * Route details panel
 */

import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Route, Stop } from '../../utils/gtfs';
import type { VehiclePosition } from '../../utils/vehicles';

interface RoutePanelProps {
  route: Route;
  routeStops: string[];
  stopsById: Map<string, Stop>;
  vehicles: VehiclePosition[];
  initialDirectionFilter?: DirectionFilter;
  onBack: () => void;
  onStopClick: (stopId: string) => void;
}

interface GroupedStop {
  name: string;
  platforms: Array<{ id: string; code: string; stop: Stop }>;
}

type DirectionFilter = 'all' | 'A' | 'B';

export function RoutePanel({
  route,
  routeStops,
  stopsById,
  vehicles,
  initialDirectionFilter = 'all',
  onBack,
  onStopClick
}: RoutePanelProps) {
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>(initialDirectionFilter);

  // Get unique headsigns from vehicles
  const headsigns = Array.from(
    new Set(vehicles.map((v) => v.headsign))
  );

  // Group stops by name
  const groupedStops = useMemo(() => {
    const groups = new Map<string, GroupedStop>();
    
    for (const stopId of routeStops) {
      const stop = stopsById.get(stopId);
      if (!stop) continue;
      
      // Apply direction filter
      if (directionFilter !== 'all') {
        const codeNum = parseInt(stop.code);
        if (!isNaN(codeNum)) {
          const isOdd = codeNum % 2 === 1;
          if (directionFilter === 'A' && !isOdd) continue;
          if (directionFilter === 'B' && isOdd) continue;
        }
      }
      
      if (!groups.has(stop.name)) {
        groups.set(stop.name, {
          name: stop.name,
          platforms: []
        });
      }
      
      groups.get(stop.name)!.platforms.push({
        id: stopId,
        code: stop.code,
        stop
      });
    }
    
    return Array.from(groups.values());
  }, [routeStops, stopsById, directionFilter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm mb-3 -ml-2 min-h-[44px] min-w-[44px] p-2"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Natrag
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`badge ${
              route.type === 0 ? 'badge-primary' : 'badge-accent'
            } badge-lg lg:badge-xl font-bold`}
          >
            {route.shortName}
          </div>
          <h2 className="text-lg lg:text-xl font-bold flex-1">{route.longName}</h2>
          
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

        {/* Vehicle count and headsigns */}
        {vehicles.length > 0 && (
          <div className="text-sm text-base-content/70 mt-2">
            <div className="font-semibold">
              {vehicles.length} vozil{vehicles.length === 1 ? 'o' : 'a'} u prometu
            </div>
            {headsigns.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {headsigns.map((headsign) => (
                  <span key={headsign} className="badge badge-sm">
                    {headsign}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stop list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold mb-3">
            Stajališta ({groupedStops.length} lokacija)
          </h3>
          <div className="space-y-2">
            {groupedStops.map((group) => {
              // When direction filter is active, treat as single platform
              // since all filtered platforms go in the same direction
              const singlePlatform = group.platforms.length === 1 || directionFilter !== 'all';
              
              return (
                <div key={group.name} className="border border-base-300 rounded-lg overflow-hidden">
                  {singlePlatform ? (
                    // Single platform - simple button
                    <button
                      onClick={() => onStopClick(group.platforms[0].id)}
                      className="w-full py-3 px-4 text-left hover:bg-base-200 transition-colors min-h-[56px]"
                    >
                      <div className="font-medium">{group.name}</div>
                      {group.platforms.length === 1 ? (
                        // Single platform - show its code and ID
                        <div className="text-xs text-base-content/60 mt-1">
                          <div>Smjer {group.platforms[0].code}</div>
                          <div className="opacity-50">ID: {group.platforms[0].id}</div>
                        </div>
                      ) : (
                        // Multiple platforms in same direction - show all codes and IDs
                        <div className="text-xs text-base-content/60 mt-1">
                          <div>Smjer {group.platforms.map(p => p.code).join(', ')}</div>
                          <div className="opacity-50">IDs: {group.platforms.map(p => p.id).join(', ')}</div>
                        </div>
                      )}
                    </button>
                  ) : (
                    // Multiple platforms - grouped view
                    <div>
                      <div className="bg-base-200 px-3 py-2 font-medium text-sm">
                        {group.name}
                      </div>
                      <div className="divide-y divide-base-300">
                        {group.platforms.map((platform) => (
                          <button
                            key={platform.id}
                            onClick={() => onStopClick(platform.id)}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-base-200 transition-colors min-h-[56px]"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div>Smjer {platform.code}</div>
                                <div className="text-xs opacity-50">ID: {platform.id}</div>
                              </div>
                              <span className="text-xs opacity-60">→</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

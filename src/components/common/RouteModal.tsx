/**
 * Route details modal - shows route info, stops, and vehicles
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import type { Route, Stop } from '../../utils/gtfs';
import type { VehiclePosition } from '../../utils/vehicles';

interface RouteModalProps {
  isOpen: boolean;
  route: Route;
  routeStops: string[];
  orderedStops?: Record<string, string[]>;
  stopsById: Map<string, Stop>;
  vehicles: VehiclePosition[];
  initialDirectionFilter?: DirectionFilter;
  onClose: () => void;
  onStopClick: (stopId: string) => void;
}

interface GroupedStop {
  name: string;
  platforms: Array<{ id: string; code: string; stop: Stop }>;
}

type DirectionFilter = 'all' | 'A' | 'B';

export function RouteModal({
  isOpen,
  route,
  routeStops,
  orderedStops,
  stopsById,
  vehicles,
  initialDirectionFilter = 'all',
  onClose,
  onStopClick
}: RouteModalProps) {
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>(initialDirectionFilter);

  const headsigns = Array.from(new Set(vehicles.map((v) => v.headsign)));

  const groupedStops = useMemo(() => {
    const groups = new Map<string, GroupedStop>();

    // Use ordered stops for proper route-sequence display
    let stopIds: string[];
    if (directionFilter === 'A' && orderedStops?.['0']) {
      stopIds = orderedStops['0'];
    } else if (directionFilter === 'B' && orderedStops?.['1']) {
      stopIds = orderedStops['1'];
    } else if (orderedStops?.['0'] || orderedStops?.['1']) {
      // 'all' - combine both directions, deduplicating by stop name
      stopIds = [...(orderedStops['0'] || []), ...(orderedStops['1'] || [])];
    } else {
      stopIds = routeStops; // fallback
    }

    for (const stopId of stopIds) {
      const stop = stopsById.get(stopId);
      if (!stop) continue;

      if (!groups.has(stop.name)) {
        groups.set(stop.name, { name: stop.name, platforms: [] });
      }
      groups.get(stop.name)!.platforms.push({ id: stopId, code: stop.code, stop });
    }

    return Array.from(groups.values());
  }, [routeStops, orderedStops, stopsById, directionFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'backdrop-fade-in 0.15s ease-out' }} onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-2 mt-2 sm:mt-8 max-h-[90vh] bg-base-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ animation: 'modal-fade-in 0.2s ease-out' }}>
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={onClose} className="btn btn-ghost btn-sm min-h-[44px] min-w-[44px] p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`badge ${route.type === 0 ? 'badge-primary' : 'badge-accent'} badge-lg font-bold shrink-0`}>
                {route.shortName}
              </div>
              <h2 className="text-lg font-bold truncate">{route.longName}</h2>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Direction filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/60">Smjer:</span>
            <div className="flex gap-1">
              {(['all', 'A', 'B'] as DirectionFilter[]).map(dir => (
                <button
                  key={dir}
                  className={`btn btn-sm min-h-[36px] ${
                    directionFilter === dir
                      ? dir === 'all' ? 'btn-neutral' : dir === 'A' ? 'btn-primary' : 'btn-secondary'
                      : 'btn-ghost'
                  }`}
                  onClick={() => setDirectionFilter(dir)}
                >
                  {dir === 'all' ? 'Svi' : dir}
                </button>
              ))}
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
                  {headsigns.map((h) => (
                    <span key={h} className="badge badge-sm">{h}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stop list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4">
            <h3 className="font-semibold mb-3">
              Stajališta ({groupedStops.length} lokacija)
            </h3>
            <div className="space-y-2">
              {groupedStops.map((group) => {
                const singlePlatform = group.platforms.length === 1 || directionFilter !== 'all';

                return (
                  <div key={group.name} className="border border-base-300 rounded-lg overflow-hidden">
                    {singlePlatform ? (
                      <button
                        onClick={() => {
                          onStopClick(group.platforms[0].id);
                        }}
                        className="w-full py-3 px-4 text-left hover:bg-base-200 active:bg-base-300 transition-colors min-h-[52px]"
                      >
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-base-content/60 mt-1">
                          Smjer {group.platforms.map(p => p.code).join(', ')}
                        </div>
                      </button>
                    ) : (
                      <div>
                        <div className="bg-base-200 px-3 py-2 font-medium text-sm">{group.name}</div>
                        <div className="divide-y divide-base-300">
                          {group.platforms.map((platform) => (
                            <button
                              key={platform.id}
                              onClick={() => {
                                onStopClick(platform.id);
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-base-200 active:bg-base-300 transition-colors min-h-[48px]"
                            >
                              <div className="flex items-center justify-between">
                                <span>Smjer {platform.code}</span>
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
    </div>
  );
}

/**
 * Route details panel — redesigned with metro-diagram sidebar.
 *
 * Desktop  : fixed left side panel (380 px wide, full height),
 *            no backdrop so the map stays interactive.
 * Mobile   : full-screen overlay with backdrop.
 *
 * Stop list + vertical metro diagram share the same scrollable flex row so
 * the dots on the line always align with the corresponding stop rows.
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, X, Train, Bus } from 'lucide-react';
import type { Route, Stop } from '../../utils/gtfs';
import type { VehiclePosition } from '../../utils/vehicles';
import {
  RouteLineDiagram,
  STOP_ROW_HEIGHT,
  STOP_LIST_PADDING_TOP,
} from './RouteLineDiagram';

interface RouteModalProps {
  isOpen: boolean;
  route: Route;
  routeStops: string[];
  orderedStops?: Record<string, string[]>;
  stopsById: Map<string, Stop>;
  vehicles: VehiclePosition[];
  /** Default direction — 'A' or 'B'. */
  initialDirectionFilter?: DirectionFilter;
  onClose: () => void;
  onStopClick: (stopId: string) => void;
}

type DirectionFilter = 'A' | 'B';

const TRAM_COLOR = '#2563eb'; // blue-600
const BUS_COLOR  = '#ea580c'; // orange-600

export function RouteModal({
  isOpen,
  route,
  routeStops,
  orderedStops,
  stopsById,
  vehicles,
  initialDirectionFilter = 'A',
  onClose,
  onStopClick,
}: RouteModalProps) {
  const [direction, setDirection] = useState<DirectionFilter>(initialDirectionFilter);

  const color = route.type === 0 ? TRAM_COLOR : BUS_COLOR;

  // Ordered stop IDs for the active direction
  const orderedStopIds: string[] = useMemo(() => {
    const key = direction === 'A' ? '0' : '1';
    if (orderedStops?.[key]?.length) return orderedStops[key];
    const fallbackKey = direction === 'A' ? '1' : '0';
    if (orderedStops?.[fallbackKey]?.length) return orderedStops[fallbackKey];
    return routeStops;
  }, [direction, orderedStops, routeStops]);

  // Vehicles for this direction (direction 0 = A, 1 = B)
  const directionIndex = direction === 'A' ? 0 : 1;
  const filteredVehicles: VehiclePosition[] = useMemo(() => {
    const dir = vehicles.filter((v) => v.direction === directionIndex);
    // If no vehicles match direction, show all (direction may be unreported)
    return dir.length > 0 ? dir : vehicles;
  }, [vehicles, directionIndex]);

  const headsigns = Array.from(
    new Set(filteredVehicles.map((v) => v.headsign).filter(Boolean))
  );
  const vehicleLabel = `${filteredVehicles.length} vozil${filteredVehicles.length === 1 ? 'o' : 'a'}`;

  if (!isOpen) return null;

  const stopRows = orderedStopIds.map((stopId, idx) => ({
    stopId,
    stop: stopsById.get(stopId),
    idx,
  }));

  return (
    <>
      {/* Mobile-only backdrop */}
      <div
        className="fixed inset-0 z-[1090] bg-black/50 backdrop-blur-sm sm:hidden"
        style={{ animation: 'backdrop-fade-in 0.15s ease-out' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-0 z-[1100] flex flex-col bg-base-100 overflow-hidden sm:inset-auto sm:left-0 sm:top-0 sm:bottom-0 sm:w-[380px] sm:shadow-2xl sm:border-r sm:border-base-300"
        style={{ animation: 'modal-fade-in 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-base-300">
          {/* Row 1: back / badge / name / close */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm p-1.5 min-h-[36px] min-w-[36px]"
              aria-label="Zatvori"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span
              className="badge badge-lg font-bold text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {route.shortName}
            </span>

            {route.type === 0
              ? <Train className="w-3.5 h-3.5 opacity-40 shrink-0" />
              : <Bus   className="w-3.5 h-3.5 opacity-40 shrink-0" />}

            <h2 className="font-bold text-sm leading-snug flex-1 min-w-0 line-clamp-2">
              {route.longName}
            </h2>

            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-sm p-1.5 min-h-[36px] min-w-[36px]"
              aria-label="Zatvori"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Row 2: direction A/B toggle + vehicle count */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-lg overflow-hidden border border-base-300">
              {(['A', 'B'] as DirectionFilter[]).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setDirection(dir)}
                  className={[
                    'px-4 py-1 text-sm font-semibold transition-colors',
                    direction === dir
                      ? 'text-white'
                      : 'bg-base-100 text-base-content/60 hover:bg-base-200',
                  ].join(' ')}
                  style={direction === dir ? { backgroundColor: color } : undefined}
                >
                  {dir}
                </button>
              ))}
            </div>

            {filteredVehicles.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-medium text-base-content/70">
                  {vehicleLabel} u prometu
                </span>
              </div>
            )}

            {headsigns.length > 0 && (
              <div className="flex flex-wrap gap-1 w-full mt-0.5">
                {headsigns.map((h) => (
                  <span key={h} className="badge badge-xs opacity-70">{h}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body: metro diagram + stop list side-by-side */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="flex" style={{ paddingTop: STOP_LIST_PADDING_TOP }}>
            {/* Metro line diagram column */}
            <RouteLineDiagram
              orderedStopIds={orderedStopIds}
              stopsById={stopsById}
              vehicles={filteredVehicles}
              routeType={route.type}
            />

            {/* Stop name list */}
            <div className="flex-1 min-w-0">
              {stopRows.map(({ stopId, stop, idx }) => {
                const isEndpoint = idx === 0 || idx === stopRows.length - 1;
                const name = stop?.name ?? stopId;
                return (
                  <button
                    key={stopId}
                    onClick={() => onStopClick(stopId)}
                    className={[
                      'w-full text-left px-3 flex items-center',
                      'transition-colors hover:bg-base-200 active:bg-base-300',
                      isEndpoint ? 'font-semibold' : '',
                    ].join(' ')}
                    style={{ height: STOP_ROW_HEIGHT }}
                  >
                    <span className="text-sm leading-tight line-clamp-1">{name}</span>
                  </button>
                );
              })}

              {stopRows.length === 0 && (
                <div className="text-sm text-base-content/50 px-3 py-8 text-center">
                  Nema dostupnih stajališta
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

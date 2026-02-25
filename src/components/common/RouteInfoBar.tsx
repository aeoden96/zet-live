/**
 * Fixed route info bar — compact "small view" for a selected route.
 * Mirrors the StopInfoBar pattern: appears below the search bar,
 * can be expanded into the full RouteModal via the Maximize2 button.
 */

import { Maximize2, X, Train, Bus, Star } from 'lucide-react';
import { DirectionLegend } from '../Map/DirectionLegend';
import type { Route, Stop } from '../../utils/gtfs';
import type { VehiclePosition } from '../../utils/vehicles';
import { useSettingsStore } from '../../stores/settingsStore';

interface RouteInfoBarProps {
  route: Route;
  vehicles: VehiclePosition[];
  onExpand: () => void;
  onClose: () => void;
  orderedStops?: Record<string, string[]>;
  stopsById?: Map<string, Stop>;
}

const TRAM_COLOR = '#2563eb'; // blue-600
const BUS_COLOR  = '#ea580c'; // orange-600

export function RouteInfoBar({ route, vehicles, onExpand, onClose, orderedStops, stopsById }: RouteInfoBarProps) {
  const color = route.type === 0 ? TRAM_COLOR : BUS_COLOR;
  const isTram = route.type === 0;
  const { favouriteRouteIds, toggleFavouriteRoute } = useSettingsStore();
  const isFav = favouriteRouteIds.includes(route.id);

  const vehicleCount = vehicles.length;
  const vehicleLabel =
    vehicleCount === 0
      ? 'Nema aktivnih vozila'
      : vehicleCount === 1
      ? `1 vozilo aktivno`
      : `${vehicleCount} vozila aktivna`;

  return (
    <div
      className="fixed top-16 sm:top-20 left-2 right-2 sm:left-4 sm:right-auto sm:max-w-md z-[1050] bg-base-100 rounded-xl shadow-2xl"
      style={{ animation: 'modal-fade-in 0.2s ease-out' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {/* Route badge */}
            <span
              className="badge font-bold text-white shrink-0 min-w-[2.5rem] justify-center"
              style={{ backgroundColor: color, borderColor: color }}
            >
              {route.shortName}
            </span>
            {/* Route name */}
            <h3 className="font-bold text-base leading-tight text-base-content truncate">
              {route.longName}
            </h3>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => toggleFavouriteRoute(route.id)}
              className="btn btn-ghost btn-circle btn-xs min-h-[32px] min-w-[32px]"
              title={isFav ? 'Ukloni iz favorita' : 'Dodaj u favorite'}
            >
              <Star
                className="w-4 h-4"
                fill={isFav ? 'currentColor' : 'none'}
                color={isFav ? '#f59e0b' : 'currentColor'}
              />
            </button>
            <button
              onClick={onExpand}
              className="btn btn-ghost btn-circle btn-xs min-h-[32px] min-w-[32px]"
              title="Prikaži detalje rute"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-xs min-h-[32px] min-w-[32px]"
              title="Zatvori"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vehicle status */}
        <div className="flex items-center gap-1.5 text-xs text-base-content/60">
          {isTram ? (
            <Train className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Bus className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className={vehicleCount > 0 ? 'text-success font-medium' : ''}>
            {vehicleLabel}
          </span>
          {vehicleCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-success animate-pulse ml-0.5" />
          )}
          {/* Inline compact direction legend (single-line) */}
          {orderedStops && stopsById && (
            <div className="ml-3 hidden sm:flex items-center">
              <div className="text-xs text-base-content/70 mr-2">Smjer:</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {/* use DirectionLegend inline */}
                  <div className="flex items-center gap-2">
                    {/* render via component for consistency */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {/* DirectionLegend inline compact */}
                      {/* DirectionLegend is valid here */}
                      <DirectionLegend orderedStops={orderedStops} stopsById={stopsById} routeType={route.type} compact inline />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

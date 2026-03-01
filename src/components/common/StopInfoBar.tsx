/**
 * Fixed stop info bar at the top — tabbed view with "Vozila" (live GPS) and "Red vožnje" (timetable).
 */

import { useState, useEffect } from 'react';
import { Maximize2, Clock, X, Star } from 'lucide-react';
import type { Stop, Route } from '../../utils/gtfs';
import { minutesToTime, bearingToDirection } from '../../utils/gtfs';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { useApproachingVehicles } from '../../hooks/useApproachingVehicles';
import { useTimetableDepartures } from '../../hooks/useTimetableDepartures';
import { useSettingsStore } from '../../stores/settingsStore';
import { StopTabSelector, type StopTab } from './StopTabSelector';
import { TimetableDepartureCard } from './TimetableDepartureCard';

/** Format distance: metres below 1000, km above */
function formatDist(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

interface StopInfoBarProps {
  stop: Stop;
  routesById: Map<string, Route>;
  stopsById: Map<string, Stop>;
  onExpand: (stopId: string) => void;
  onClose: () => void;
  /** When true, shifts the bar down so it sits below the RouteInfoBar */
  stackBelow?: boolean;
}

export function StopInfoBar({
  stop,
  routesById,
  stopsById,
  onExpand,
  onClose,
  stackBelow = false,
}: StopInfoBarProps) {
  const currentTime = useCurrentTime();
  const { favouriteStopIds, toggleFavouriteStop } = useSettingsStore();
  const isFav = favouriteStopIds.includes(stop.id);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<StopTab>('vehicles');

  // 1-second tick for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { vehicles: allVehicles, loading: vehiclesLoading } = useApproachingVehicles(
    stop.id,
    stopsById,
    routesById,
    nowMs
  );
  const liveVehicles = allVehicles
    .filter((v) => v.confidence === 'realtime')
    .sort((a, b) => {
      if (a.passedStop !== b.passedStop) return a.passedStop ? -1 : 1;
      if (a.passedStop && b.passedStop) return (b.distanceMeters ?? 0) - (a.distanceMeters ?? 0);
      return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
    });
  const topVehicles = liveVehicles.slice(0, 4);
  const liveCount = liveVehicles.filter((v) => !v.passedStop).length;

  const { departures: timetableDepartures, loading: timetableLoading } = useTimetableDepartures(
    stop.id,
    routesById,
    nowMs
  );
  const topDepartures = timetableDepartures.slice(0, 4);

  return (
    <div
      data-testid="stop-info-panel"
      className={`fixed left-2 right-2 sm:left-4 sm:right-auto sm:max-w-md z-[1050] bg-base-100 rounded-xl shadow-2xl ${stackBelow ? 'top-44 sm:top-44' : 'top-16 sm:top-20'
        }`}
      style={{ animation: 'modal-fade-in 0.2s ease-out' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight text-base-content mb-1">
              {stop.name}
            </h3>
            {(stop.bearing !== undefined || stop.code) && (
              <div className="text-xs text-base-content/60 flex items-center gap-1">
                <span>
                  {stop.bearing !== undefined
                    ? `Smjer prema ${bearingToDirection(stop.bearing)}`
                    : `Smjer ${stop.code}`}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFavouriteStop(stop.id)}
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
              onClick={() => onExpand(stop.id)}
              className="btn btn-ghost btn-circle btn-xs min-h-[32px] min-w-[32px]"
              title="Prikaži detalje"
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

        {/* Current time */}
        <div className="flex items-center justify-end mb-2 pb-2 border-b border-base-300">
          <div className="flex items-center gap-1.5 text-xs text-base-content/60">
            <Clock className="w-3.5 h-3.5" />
            <span>{minutesToTime(currentTime)}</span>
          </div>
        </div>

        {/* Tab selector */}
        <div className="mb-2">
          <StopTabSelector
            activeTab={activeTab}
            onTabChange={setActiveTab}
            liveVehicleCount={liveCount}
            compact
          />
        </div>

        {/* Vehicles tab */}
        {activeTab === 'vehicles' && (
          vehiclesLoading ? (
            <div className="flex items-center gap-2 py-2">
              <span className="loading loading-spinner loading-sm" />
              <span className="text-sm text-base-content/60">Tražim vozila...</span>
            </div>
          ) : topVehicles.length === 0 ? (
            <div className="text-sm text-base-content/50 py-2 text-center">
              Nema GPS vozila u blizini
            </div>
          ) : (
            <div className="space-y-2">
              {topVehicles.map((vehicle) => {
                const d = vehicle.distanceMeters;
                const isAtStop = d !== null && d < 15;

                // Primary: distance
                let primaryText: string;
                let primaryColor: string;
                if (vehicle.passedStop) {
                  primaryText = d !== null ? `${formatDist(d)} ↑` : 'Prošao';
                  primaryColor = 'text-base-content/40';
                } else if (isAtStop) {
                  primaryText = 'Na stajalištu';
                  primaryColor = 'text-success font-bold';
                } else if (d !== null) {
                  primaryText = formatDist(d);
                  primaryColor = d < 100 ? 'text-success' : 'text-base-content';
                } else {
                  const secs = Math.round(vehicle.arrivingInSeconds);
                  primaryText = secs <= 0 ? 'Sada' : secs < 120 ? `za ${secs} sek` : `za ${Math.round(secs / 60)} min`;
                  primaryColor = secs <= 0 ? 'text-success' : 'text-base-content';
                }

                // Secondary: GPS time estimate
                let secondaryText: string | null = null;
                if (!vehicle.passedStop && !isAtStop && d !== null) {
                  const gpsSecs = vehicle.etaFromGpsSeconds;
                  if (gpsSecs !== null) {
                    secondaryText = gpsSecs < 30 ? 'Dolazi' : gpsSecs < 120 ? `~${Math.round(gpsSecs)} sek` : `~${Math.round(gpsSecs / 60)} min`;
                  } else {
                    const secs = Math.round(vehicle.arrivingInSeconds);
                    secondaryText = secs < 120 ? `~${secs} sek` : `~${Math.round(secs / 60)} min`;
                  }
                }

                return (
                  <div
                    key={vehicle.tripId}
                    className={`flex items-center gap-2 rounded-lg px-1.5 py-1 -mx-1.5 transition-colors ${vehicle.passedStop ? 'opacity-50' :
                        isAtStop ? 'bg-success/10 ring-1 ring-success/60' :
                          (d !== null && d < 100) ? 'bg-success/5 ring-1 ring-success/30' :
                            ''
                      }`}
                  >
                    <span
                      className={`badge ${vehicle.routeType === 0 ? 'badge-primary' : 'badge-accent'
                        } badge-sm font-bold min-w-[2.5rem] justify-center shrink-0 ${isAtStop ? 'animate-pulse' : ''
                        }`}
                    >
                      {vehicle.routeShortName}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-base-content/80 truncate">{vehicle.routeLongName}</div>
                      <div className="text-[11px] text-base-content/45 leading-tight flex items-center gap-1">
                        {vehicle.passedStop ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 animate-pulse" />
                        )}
                        <span>
                          {vehicle.passedStop
                            ? 'Prošao stajalište'
                            : vehicle.stopsAway !== null && vehicle.stopsAway > 0
                              ? `${vehicle.stopsAway} stajališta`
                              : 'GPS uživo'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-bold text-sm tabular-nums whitespace-nowrap ${primaryColor}`}>
                        {primaryText}
                      </div>
                      {secondaryText && (
                        <div className="text-xs text-base-content/50 tabular-nums">{secondaryText}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Timetable tab */}
        {activeTab === 'timetable' && (
          timetableLoading ? (
            <div className="flex items-center gap-2 py-2">
              <span className="loading loading-spinner loading-sm" />
              <span className="text-sm text-base-content/60">Učitavam red vožnje...</span>
            </div>
          ) : topDepartures.length === 0 ? (
            <div className="text-sm text-base-content/50 py-2 text-center">
              Nema polazaka u sljedećih 60 min
            </div>
          ) : (
            <div className="space-y-2">
              {topDepartures.map((dep) => (
                <TimetableDepartureCard key={dep.tripId} departure={dep} compact />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

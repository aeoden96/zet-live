/**
 * Fixed stop info bar at the top - shows approaching vehicles (realtime + scheduled).
 * Replaces the inline map popup with a cleaner fixed UI.
 */

import { useState, useEffect } from 'react';
import { Maximize2, Clock, X, Star } from 'lucide-react';
import type { Stop, Route } from '../../utils/gtfs';
import { minutesToTime } from '../../utils/gtfs';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { useApproachingVehicles } from '../../hooks/useApproachingVehicles';
import { useSettingsStore } from '../../stores/settingsStore';

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

  // 1-second tick for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { vehicles: approachingVehicles, loading: vehiclesLoading } = useApproachingVehicles(
    stop.id,
    stopsById,
    routesById,
    nowMs
  );
  const topVehicles = approachingVehicles.slice(0, 4);

  return (
    <div
      className={`fixed left-2 right-2 sm:left-4 sm:right-auto sm:max-w-md z-[1050] bg-base-100 rounded-xl shadow-2xl ${
        stackBelow ? 'top-36 sm:top-44' : 'top-16 sm:top-20'
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
            {stop.code && (
              <div className="text-xs text-base-content/60 flex items-center gap-1">
                <span>Smjer {stop.code}</span>
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
        <div className="flex items-center justify-end mb-3 pb-2 border-b border-base-300">
          <div className="flex items-center gap-1.5 text-xs text-base-content/60">
            <Clock className="w-3.5 h-3.5" />
            <span>{minutesToTime(currentTime)}</span>
          </div>
        </div>

        {/* Vehicle list */}
        {vehiclesLoading ? (
          <div className="flex items-center gap-2 py-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm text-base-content/60">Tražim vozila...</span>
          </div>
        ) : topVehicles.length === 0 ? (
          <div className="text-sm text-base-content/50 py-2 text-center">
            Nema vozila u sljedećih 30 min
          </div>
        ) : (
          <div className="space-y-2">
            {topVehicles.map((vehicle) => {
              const d = vehicle.distanceMeters;
              const isScheduled = vehicle.confidence === 'scheduled';

              // GPS proximity overrides timetable ETA at short range
              let arriving = false;
              let etaText: string;
              if (d !== null && d < 15) {
                arriving = true;
                etaText = 'na stajalištu';
              } else if (d !== null && d < 100) {
                const estSecs = Math.round(d / 5);
                etaText = `~${estSecs} sek`;
              } else {
                const secs = Math.round(vehicle.arrivingInSeconds);
                arriving = secs <= 0;
                if (arriving) {
                  etaText = 'Sada';
                } else if (secs < 120) {
                  etaText = `${isScheduled ? '~' : ''}za ${secs} sek`;
                } else {
                  const mins = Math.round(secs / 60);
                  if (mins < 60) {
                    etaText = `${isScheduled ? '~' : ''}za ${mins} min`;
                  } else {
                    const adjusted = vehicle.etaMinutes + (vehicle.delaySeconds ?? 0) / 60;
                    etaText = `${isScheduled ? '~' : ''}${minutesToTime(adjusted)}`;
                  }
                }
              }

              const delaySec = vehicle.delaySeconds ?? 0;
              const delayMin = Math.round(Math.abs(delaySec) / 60);
              const isLate = delaySec > 90;
              const isEarly = delaySec < -90;

              const stopsText =
                vehicle.stopsAway === null
                  ? null
                  : vehicle.stopsAway === 0
                  ? 'na stajalištu'
                  : `${vehicle.stopsAway} ${vehicle.stopsAway === 1 ? 'stajalište' : 'stajališta'}`;
              const distText = vehicle.distanceMeters !== null ? `~${vehicle.distanceMeters} m` : null;
              const subText =
                [stopsText, distText].filter(Boolean).join(' · ') ||
                (isScheduled ? 'red vožnje' : 'GPS uživo');

              return (
                <div
                  key={vehicle.tripId}
                  className={`flex items-center gap-2 ${isScheduled ? 'opacity-60' : ''}`}
                >
                  <span
                    className={`badge ${
                      vehicle.routeType === 0 ? 'badge-primary' : 'badge-accent'
                    } badge-sm font-bold min-w-[2.5rem] justify-center shrink-0`}
                  >
                    {vehicle.routeShortName}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-base-content/80 truncate">{vehicle.routeLongName}</div>
                    <div className="text-[11px] text-base-content/45 leading-tight flex items-center gap-1">
                      {vehicle.confidence === 'realtime' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-base-content/30 shrink-0" />
                      )}
                      <span>{subText}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold text-sm tabular-nums whitespace-nowrap ${
                        arriving
                          ? 'text-success'
                          : isScheduled
                          ? 'text-base-content/50'
                          : 'text-base-content'
                      }`}
                    >
                      {etaText}
                    </div>
                    {vehicle.delaySeconds !== null && (isLate || isEarly) && (
                      <div className={`text-xs font-medium ${isLate ? 'text-error' : 'text-success'}`}>
                        {isLate ? `+${delayMin}` : `-${delayMin}`} min
                      </div>
                    )}
                    {vehicle.delaySeconds !== null && !isLate && !isEarly && (
                      <div className="text-xs text-success">Na vrij.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

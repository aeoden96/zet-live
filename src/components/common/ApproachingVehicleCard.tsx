/**
 * A single vehicle card in the approaching-vehicles list.
 *
 * Shows route badge, ETA countdown, stops-away, and a reverse progress bar
 * that shrinks as the vehicle approaches. Schedule-only trips are shown grayed
 * with a "~" prefix.
 */

import { useEffect, useRef, useState } from 'react';
import type { ApproachingVehicle } from '../../hooks/useApproachingVehicles';
import { minutesToTime } from '../../utils/gtfs';

interface ApproachingVehicleCardProps {
  vehicle: ApproachingVehicle;
  onRouteClick?: (routeId: string, routeType: number) => void;
}

/** Reference window used for proportional bar width (30 min) */
const WINDOW_SECONDS = 30 * 60;

function formatArrivingIn(
  seconds: number,
  isScheduled: boolean,
  etaMinutes: number,
  delaySeconds: number | null
): string {
  const prefix = isScheduled ? '~' : '';
  if (seconds <= 0) return 'Sada';
  if (seconds < 120) return `${prefix}za ${Math.round(seconds)} sek`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${prefix}za ${mins} min`;
  const adjusted = etaMinutes + (delaySeconds ?? 0) / 60;
  return `${prefix}${minutesToTime(adjusted)}`;
}

export function ApproachingVehicleCard({ vehicle, onRouteClick }: ApproachingVehicleCardProps) {
  const isScheduled = vehicle.confidence === 'scheduled';
  const isArriving = vehicle.arrivingInSeconds <= 0;

  // Animate out when the vehicle has arrived: shrink height to 0
  const [leaving, setLeaving] = useState(false);
  const prevArrivingRef = useRef(vehicle.arrivingInSeconds);

  useEffect(() => {
    const prev = prevArrivingRef.current;
    prevArrivingRef.current = vehicle.arrivingInSeconds;

    // Trigger leave animation when crossing from positive to 0 / negative
    if (prev > 0 && vehicle.arrivingInSeconds <= 0) {
      setLeaving(true);
    }
  }, [vehicle.arrivingInSeconds]);

  // Progress bar: proportional to remaining time (wide = far, narrow = close)
  const remaining = Math.max(0, vehicle.arrivingInSeconds);
  const barPercent = Math.min(100, (remaining / WINDOW_SECONDS) * 100);

  // Delay badge
  const delaySec = vehicle.delaySeconds ?? 0;
  const delayMin = Math.round(Math.abs(delaySec) / 60);
  const isLate = delaySec > 90;
  const isEarly = delaySec < -90;

  const badgeClass = vehicle.routeType === 0 ? 'badge-primary' : 'badge-accent';
  const dimClass = isScheduled ? 'opacity-60' : '';

  return (
    <div
      className={`card bg-base-200 overflow-hidden transition-all duration-500 ${
        leaving ? 'opacity-0 max-h-0 !py-0 !my-0' : 'max-h-40 opacity-100'
      }`}
    >
      <div className="card-body p-3 pb-2 gap-0">
        {/* Top row: badge + name + ETA + delay */}
        <div className={`flex items-center gap-2 mb-1.5 ${dimClass}`}>
          {/* Route badge */}
          <div className={`badge ${badgeClass} font-bold shrink-0 min-w-[2.75rem] justify-center`}>
            {vehicle.routeShortName}
          </div>

          {/* Route name */}
          <div className="flex-1 min-w-0">
            {onRouteClick ? (
              <button
                onClick={() => onRouteClick(vehicle.routeId, vehicle.routeType)}
                className="text-sm font-medium truncate leading-tight text-left hover:opacity-70 transition-opacity w-full block"
              >
                {vehicle.routeLongName}
              </button>
            ) : (
              <div className="text-sm font-medium truncate leading-tight">
                {vehicle.routeLongName}
              </div>
            )}
            {/* Stops away / realtime indicator */}
            <div className="text-xs text-base-content/50 mt-0.5 flex items-center gap-1.5">
              {vehicle.confidence === 'realtime' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 animate-pulse" />
                  {vehicle.stopsAway !== null ? (
                    <span>
                      {vehicle.stopsAway === 0
                        ? 'na stajalištu'
                        : `${vehicle.stopsAway} ${vehicle.stopsAway === 1 ? 'staništa' : 'stajališta'}`}
                    </span>
                  ) : (
                    <span>GPS uživo</span>
                  )}
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-base-content/30 shrink-0" />
                  <span>prema redu vožnje</span>
                </>
              )}
            </div>
          </div>

          {/* ETA + delay */}
          <div className="text-right shrink-0">
            <div
              className={`font-bold text-sm ${
                isArriving
                  ? 'text-success'
                  : isScheduled
                  ? 'text-base-content/50'
                  : 'text-base-content'
              }`}
            >
              {formatArrivingIn(vehicle.arrivingInSeconds, isScheduled, vehicle.etaMinutes, vehicle.delaySeconds)}
            </div>
            {vehicle.delaySeconds !== null && (isLate || isEarly) && (
              <div className="text-[11px] text-base-content/40">
                red: {minutesToTime(vehicle.etaMinutes)}
              </div>
            )}
            {vehicle.delaySeconds !== null && (isLate || isEarly) && (
              <div className={`text-xs font-medium ${isLate ? 'text-error' : 'text-success'}`}>
                {isLate ? `+${delayMin}` : `-${delayMin}`} min
              </div>
            )}
            {vehicle.delaySeconds !== null && !isLate && !isEarly && (
              <div className="text-xs text-success font-medium">Na vrij.</div>
            )}
          </div>
        </div>

        {/* Reverse progress bar */}
        <div className="w-full h-1 bg-base-300 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-[4s] ease-linear ${
              isScheduled
                ? 'bg-base-content/25'
                : isArriving
                ? 'bg-success'
                : vehicle.routeType === 0
                ? 'bg-primary'
                : 'bg-accent'
            }`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

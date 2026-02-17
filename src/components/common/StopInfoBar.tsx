/**
 * Fixed stop info bar at the top - shows mini departure board
 * Replaces the inline map popup with a cleaner fixed UI
 */

import { useMemo, useState, useEffect } from 'react';
import { Maximize2, Clock, X } from 'lucide-react';
import type { Stop, Route } from '../../utils/gtfs';
import { minutesToTime } from '../../utils/gtfs';
import { useStopDepartures } from '../../hooks/useStopDepartures';
import { useCurrentTime } from '../../hooks/useCurrentTime';

interface StopInfoBarProps {
  stop: Stop;
  routesById: Map<string, Route>;
  serviceId: string | null;
  onExpand: (stopId: string) => void;
  onClose: () => void;
}

export function StopInfoBar({
  stop,
  routesById,
  serviceId,
  onExpand,
  onClose
}: StopInfoBarProps) {
  const { departures, loading } = useStopDepartures(stop.id);
  const currentTime = useCurrentTime();
  const [, setTick] = useState(0);

  // Re-render every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const miniDepartures = useMemo(() => {
    if (!departures || !serviceId || !departures.departures[serviceId]) return [];

    const serviceDeps = departures.departures[serviceId];
    const results: Array<{ route: Route; nextTime: number; formattedTime: string }> = [];

    for (const routeId of departures.routes) {
      const times = serviceDeps[routeId] || [];
      const route = routesById.get(routeId);
      if (!route) continue;

      const nextTime = times.find(t => t >= currentTime);
      if (nextTime !== undefined) {
        const diff = Math.round(nextTime - currentTime);
        let formatted: string;
        if (diff <= 0) formatted = 'Sada';
        else if (diff < 60) formatted = `${diff} min`;
        else formatted = minutesToTime(nextTime);

        results.push({ route, nextTime, formattedTime: formatted });
      }
    }

    return results.sort((a, b) => a.nextTime - b.nextTime).slice(0, 5);
  }, [departures, serviceId, routesById, currentTime]);

  return (
    <div 
      className="fixed top-16 sm:top-20 left-2 right-2 sm:left-4 sm:right-auto sm:max-w-md z-[1050] bg-base-100 rounded-xl shadow-2xl"
      style={{ animation: 'modal-fade-in 0.2s ease-out' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
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
              onClick={() => onExpand(stop.id)}
              className="btn btn-ghost btn-circle btn-xs min-h-[32px] min-w-[32px]"
              title="Prikaži sve polaske"
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

        {/* Current time indicator */}
        <div className="flex items-center gap-1.5 text-xs text-base-content/60 mb-2 pb-2 border-b border-base-300">
          <Clock className="w-3.5 h-3.5" />
          <span>{minutesToTime(currentTime)}</span>
        </div>

        {/* Mini departures */}
        {loading ? (
          <div className="flex items-center gap-2 py-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm text-base-content/60">Učitavanje...</span>
          </div>
        ) : miniDepartures.length > 0 ? (
          <div className="space-y-2">
            {miniDepartures.map(({ route, formattedTime }, idx) => (
              <div 
                key={`${route.id}-${idx}`} 
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className={`badge ${
                      route.type === 0 ? 'badge-primary' : 'badge-accent'
                    } badge-sm font-bold min-w-[2.5rem] justify-center shrink-0`}
                  >
                    {route.shortName}
                  </span>
                  <span className="text-xs text-base-content/80 truncate">
                    {route.longName}
                  </span>
                </div>
                <span 
                  className={`font-semibold text-sm whitespace-nowrap ${
                    idx === 0 ? 'text-success' : 'text-base-content/70'
                  }`}
                >
                  {formattedTime}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-base-content/50 py-2 text-center">
            Nema nadolazećih polazaka
          </div>
        )}
      </div>
    </div>
  );
}

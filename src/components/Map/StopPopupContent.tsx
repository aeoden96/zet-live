/**
 * Enhanced stop popup content for the map bubble
 * Shows a mini departure board inline + expand button for full modal
 */

import { useMemo, useState, useEffect } from 'react';
import { Maximize2, Clock } from 'lucide-react';
import type { Stop, Route } from '../../utils/gtfs';
import { minutesToTime, bearingToDirection } from '../../utils/gtfs';
import { useStopDepartures } from '../../hooks/useStopDepartures';
import { useCurrentTime } from '../../hooks/useCurrentTime';

interface StopPopupContentProps {
  stop: Stop;
  routesById: Map<string, Route>;
  serviceId: string | null;
  onExpand: (stopId: string) => void;
}

export function StopPopupContent({
  stop,
  routesById,
  serviceId,
  onExpand
}: StopPopupContentProps) {
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
    <div className="min-w-[220px] max-w-[280px] p-1">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3 pr-8">
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand(stop.id);
          }}
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity rounded-md p-1 hover:bg-base-200"
          style={{ width: '24px', height: '24px', position: 'absolute', top: '8px', right: '36px' }}
          title="Prikaži sve polaske"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Current time indicator */}
      <div className="flex items-center gap-1.5 text-xs text-base-content/60 mb-2 pb-2 border-b border-base-300">
        <Clock className="w-3.5 h-3.5" />
        <span>{minutesToTime(currentTime)}</span>
      </div>

      {/* Mini departures */}
      {loading ? (
        <div className="flex items-center gap-2 py-3">
          <span className="loading loading-spinner loading-sm"></span>
          <span className="text-sm text-base-content/60">Učitavanje...</span>
        </div>
      ) : miniDepartures.length > 0 ? (
        <div className="space-y-2">
          {miniDepartures.map(({ route, formattedTime }, idx) => (
            <div 
              key={`${route.id}-${idx}`} 
              className="flex items-center justify-between gap-2 py-1"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${
                    route.type === 0 ? 'badge-primary' : 'badge-accent'
                  } badge-sm font-bold min-w-[2.5rem] justify-center`}
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
  );
}

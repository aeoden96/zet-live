/**
 * Enhanced stop popup content for the map bubble
 * Shows a mini departure board inline + expand button for full modal
 */

import { useMemo, useState, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import type { Stop, Route } from '../../utils/gtfs';
import { minutesToTime } from '../../utils/gtfs';
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

    return results.sort((a, b) => a.nextTime - b.nextTime).slice(0, 4);
  }, [departures, serviceId, routesById, currentTime]);

  return (
    <div className="min-w-[180px] max-w-[240px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <div className="font-bold text-sm leading-tight">{stop.name}</div>
          {stop.code && (
            <div className="text-[11px] text-gray-500">Smjer {stop.code}</div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand(stop.id);
          }}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          title="Prikaži sve polaske"
        >
          <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      {/* Mini departures */}
      {loading ? (
        <div className="flex items-center gap-1.5 py-1">
          <span className="loading loading-spinner loading-xs"></span>
          <span className="text-xs text-gray-400">Učitavanje...</span>
        </div>
      ) : miniDepartures.length > 0 ? (
        <div className="space-y-0.5 mt-1">
          {miniDepartures.map(({ route, formattedTime }, idx) => (
            <div key={`${route.id}-${idx}`} className="flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center justify-center min-w-[2rem] px-1 py-0.5 rounded text-white font-bold text-[10px] leading-none ${
                  route.type === 0 ? 'bg-blue-600' : 'bg-orange-500'
                }`}
              >
                {route.shortName}
              </span>
              <span className={`font-semibold ${idx === 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {formattedTime}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-gray-400 mt-1">Nema polazaka</div>
      )}
    </div>
  );
}

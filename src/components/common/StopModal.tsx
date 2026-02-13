/**
 * Full-screen stop modal - expanded view of stop departures
 * Opened from the map popup expand button
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Clock } from 'lucide-react';
import type { Stop, Route, StopDepartures } from '../../utils/gtfs';
import { minutesToTime } from '../../utils/gtfs';
import { useCurrentTime } from '../../hooks/useCurrentTime';

interface StopModalProps {
  isOpen: boolean;
  stop: Stop;
  departures: StopDepartures | null;
  routesById: Map<string, Route>;
  serviceId: string | null;
  onClose: () => void;
  onRouteClick: (routeId: string, routeType: number) => void;
}

export function StopModal({
  isOpen,
  stop,
  departures,
  routesById,
  serviceId,
  onClose,
  onRouteClick
}: StopModalProps) {
  const currentTime = useCurrentTime();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const routeDepartures = useMemo(() => {
    if (!departures || !serviceId || !departures.departures[serviceId]) return [];

    const serviceDepartures = departures.departures[serviceId];
    const results: Array<{ routeId: string; route: Route; times: number[] }> = [];

    for (const routeId of departures.routes) {
      const times = serviceDepartures[routeId] || [];
      const route = routesById.get(routeId);

      if (route && times.length > 0) {
        const upcomingTimes = times.filter((t) => t >= currentTime).slice(0, 8);
        if (upcomingTimes.length > 0) {
          results.push({ routeId, route, times: upcomingTimes });
        }
      }
    }

    return results.sort((a, b) => a.times[0] - b.times[0]);
  }, [departures, serviceId, routesById, currentTime]);

  const formatDeparture = (time: number) => {
    const diffMinutes = Math.round(time - currentTime);
    if (diffMinutes < 0) return minutesToTime(time);
    if (diffMinutes === 0) return 'Sada';
    if (diffMinutes < 60) return `za ${diffMinutes} min`;
    return minutesToTime(time);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'backdrop-fade-in 0.15s ease-out' }} onClick={onClose} />

      {/* Modal - full screen on mobile, centered card on desktop */}
      <div className="relative w-full h-full sm:w-full sm:max-w-lg sm:mx-2 sm:mt-8 sm:max-h-[90vh] sm:h-auto bg-base-100 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ animation: 'modal-fade-in 0.2s ease-out' }}>
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold flex-1">{stop.name}</h2>
            <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-base-content/60">
              {stop.code && <span>Smjer {stop.code}</span>}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-base-content/70">
              <Clock className="w-4 h-4" />
              <span>{minutesToTime(currentTime)}</span>
            </div>
          </div>
        </div>

        {/* Departures */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {!serviceId ? (
            <div className="p-8 text-center text-base-content/50">
              Nema podataka o servisu za današnji dan
            </div>
          ) : routeDepartures.length === 0 ? (
            <div className="p-8 text-center text-base-content/50">
              Nema nadolazećih polazaka
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <h3 className="font-semibold">Sljedeći polasci</h3>

              {routeDepartures.map(({ routeId, route, times }) => (
                <div key={routeId} className="card bg-base-200">
                  <div className="card-body p-3">
                    <button
                      onClick={() => {
                        onRouteClick(routeId, route.type);
                        onClose();
                      }}
                      className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                    >
                      <div className={`badge ${route.type === 0 ? 'badge-primary' : 'badge-accent'} font-bold`}>
                        {route.shortName}
                      </div>
                      <div className="text-sm font-medium">{route.longName}</div>
                    </button>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {times.map((time, idx) => (
                        <div
                          key={idx}
                          className={`badge ${idx === 0 ? 'badge-lg font-bold' : 'badge-md'}`}
                        >
                          {formatDeparture(time)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

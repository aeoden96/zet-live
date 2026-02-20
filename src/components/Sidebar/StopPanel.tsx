/**
 * Stop departure board panel
 */

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import type { Stop, Route, StopDepartures } from '../../utils/gtfs';
import { minutesToTime, bearingToDirection } from '../../utils/gtfs';
import { useCurrentTime } from '../../hooks/useCurrentTime';

interface StopPanelProps {
  stop: Stop;
  departures: StopDepartures | null;
  routesById: Map<string, Route>;
  serviceId: string | null;
  onBack: () => void;
  onRouteClick: (routeId: string, routeType: number) => void;
}

export function StopPanel({
  stop,
  departures,
  routesById,
  serviceId,
  onBack,
  onRouteClick
}: StopPanelProps) {
  const currentTime = useCurrentTime();
  const [, setTick] = useState(0);

  // Force re-render every minute to update real time
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Get departures for the current service
  const routeDepartures = useMemo(() => {
    if (!departures || !serviceId || !departures.departures[serviceId]) {
      return [];
    }

    const serviceDepartures = departures.departures[serviceId];
    const results: Array<{ routeId: string; route: Route; times: number[] }> = [];

    for (const routeId of departures.routes) {
      const times = serviceDepartures[routeId] || [];
      const route = routesById.get(routeId);
      
      if (route && times.length > 0) {
        // Get next 5 departures
        const upcomingTimes = times
          .filter((time) => time >= currentTime)
          .slice(0, 5);
        
        if (upcomingTimes.length > 0) {
          results.push({ routeId, route, times: upcomingTimes });
        }
      }
    }

    return results.sort((a, b) => a.times[0] - b.times[0]);
  }, [departures, serviceId, routesById, currentTime]);

  const formatDeparture = (time: number) => {
    const diffMinutes = Math.round(time - currentTime);
    
    if (diffMinutes < 0) {
      return minutesToTime(time);
    } else if (diffMinutes === 0) {
      return 'Sada';
    } else if (diffMinutes < 60) {
      return `za ${diffMinutes} min`;
    } else {
      return minutesToTime(time);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm mb-3 -ml-2 min-h-[44px] min-w-[44px] p-2"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Natrag
        </button>
        
        <div className="mb-2">
          <h2 className="text-lg lg:text-xl font-bold">{stop.name}</h2>
          <div className="text-sm text-base-content/60">
            {(stop.bearing !== undefined || stop.code) && (
              <div>
                {stop.bearing !== undefined
                  ? `Smjer prema ${bearingToDirection(stop.bearing)}`
                  : `Smjer ${stop.code}`}
              </div>
            )}
            <div className="text-xs opacity-50">ID: {stop.id}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <Clock className="w-4 h-4" />
          <span>{minutesToTime(currentTime)}</span>
        </div>
      </div>

      {/* Departures */}
      <div className="flex-1 overflow-y-auto">
        {!serviceId ? (
          <div className="p-4 text-center text-base-content/50">
            Nema podataka o servisu za današnji dan
          </div>
        ) : routeDepartures.length === 0 ? (
          <div className="p-4 text-center text-base-content/50">
            Nema nadolazećih polazaka
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold">Sljedeći polasci</h3>
            
            {routeDepartures.map(({ routeId, route, times }) => (
              <div key={routeId} className="card bg-base-200">
                <div className="card-body p-3">
                  <button
                    onClick={() => onRouteClick(routeId, route.type)}
                    className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  >
                    <div
                      className={`badge ${
                        route.type === 0 ? 'badge-primary' : 'badge-accent'
                      } font-bold`}
                    >
                      {route.shortName}
                    </div>
                    <div className="text-sm font-medium">{route.longName}</div>
                  </button>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {times.map((time, idx) => (
                      <div
                        key={idx}
                        className={`badge ${
                          idx === 0 ? 'badge-lg font-bold' : 'badge-md'
                        }`}
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
  );
}

/**
 * Full-screen stop modal - expanded view of approaching vehicles
 * Opened from the map popup expand button
 */

import { useState, useEffect } from 'react';
import { X, Clock, Star } from 'lucide-react';
import type { Stop, Route } from '../../utils/gtfs';
import { minutesToTime } from '../../utils/gtfs';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { useApproachingVehicles } from '../../hooks/useApproachingVehicles';
import { ApproachingVehicleCard } from './ApproachingVehicleCard';
import { useSettingsStore } from '../../stores/settingsStore';

interface StopModalProps {
  isOpen: boolean;
  stop: Stop;
  routesById: Map<string, Route>;
  stopsById: Map<string, Stop>;
  onClose: () => void;
  onRouteClick: (routeId: string, routeType: number) => void;
}

export function StopModal({
  isOpen,
  stop,
  routesById,
  stopsById,
  onClose,
  onRouteClick,
}: StopModalProps) {
  const currentTime = useCurrentTime();
  const { favouriteStopIds, toggleFavouriteStop } = useSettingsStore();
  const isFav = favouriteStopIds.includes(stop.id);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // 1-second tick for live countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Approaching vehicles data (only active when modal is open)
  const { vehicles: approachingVehicles, loading: vehiclesLoading } = useApproachingVehicles(
    isOpen ? stop.id : null,
    stopsById,
    routesById,
    nowMs
  );

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
            <button
              onClick={() => toggleFavouriteStop(stop.id)}
              className="btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px]"
              title={isFav ? 'Ukloni iz favorita' : 'Dodaj u favorite'}
            >
              <Star
                className="w-5 h-5"
                fill={isFav ? 'currentColor' : 'none'}
                color={isFav ? '#f59e0b' : 'currentColor'}
              />
            </button>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {vehiclesLoading ? (
            <div className="flex items-center justify-center gap-3 p-8 text-base-content/50">
              <span className="loading loading-spinner loading-sm" />
              <span>Tražim vozila...</span>
            </div>
          ) : approachingVehicles.length === 0 ? (
            <div className="p-8 text-center text-base-content/50">
              Nema vozila koja dolaze u sljedećih 30 min
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Nadolazeća vozila</h3>
                <span className="text-xs text-base-content/40">slj. 30 min</span>
              </div>
              {approachingVehicles.map((vehicle) => (
                <ApproachingVehicleCard
                  key={vehicle.tripId}
                  vehicle={vehicle}
                  onRouteClick={(routeId, routeType) => {
                    onRouteClick(routeId, routeType);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

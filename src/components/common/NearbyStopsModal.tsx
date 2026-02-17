/**
 * Modal showing nearest stops to the user's current GPS location.
 */

import { X, MapPin, Navigation } from 'lucide-react';
import type { Stop } from '../../utils/gtfs';
import { findNearestStops } from '../../utils/gtfs';

interface NearbyStopsModalProps {
  isOpen: boolean;
  userLat: number;
  userLon: number;
  /** Platform stops only (locationType === 0) to search against */
  stops: Stop[];
  onClose: () => void;
  onSelectStop: (stopId: string) => void;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function NearbyStopsModal({
  isOpen,
  userLat,
  userLon,
  stops,
  onClose,
  onSelectStop,
}: NearbyStopsModalProps) {
  if (!isOpen) return null;

  // findNearestStops returns platform stops sorted by distance (km)
  const nearby = findNearestStops(stops, userLat, userLon, 15);

  // Deduplicate by stop name — show unique named stops only (closest platform per name)
  const seen = new Set<string>();
  const unique = nearby.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });

  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ animation: 'backdrop-fade-in 0.15s ease-out' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-2 mt-2 sm:mt-8 max-h-[90vh] bg-base-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'modal-fade-in 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-lg font-bold flex-1">Obližnje stanice</h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-base-content/60 mt-1 ml-8">
            Sortirano po udaljenosti od vaše lokacije
          </p>
        </div>

        {/* Stop list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {unique.length === 0 ? (
            <div className="p-8 text-center text-base-content/50">
              Nema stanica u blizini
            </div>
          ) : (
            <div className="divide-y divide-base-300">
              {unique.map((stop) => (
                <button
                  key={stop.id}
                  onClick={() => {
                    onSelectStop(stop.id);
                    onClose();
                  }}
                  className="w-full py-3 px-4 text-left hover:bg-base-200 active:bg-base-300 transition-colors min-h-[56px] flex items-center gap-3"
                >
                  <MapPin className="w-4 h-4 text-base-content/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{stop.name}</div>
                    {stop.code && (
                      <div className="text-xs text-base-content/50">Smjer {stop.code}</div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-primary shrink-0">
                    {formatDistance(stop.distance)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

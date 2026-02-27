/**
 * Bike station info bar — shows details about a nextbike station.
 */

import { Bike, MapPin, X, Navigation } from 'lucide-react';
import type { BajsStation } from '../../hooks/useNextbikeData';

interface BikeStationInfoBarProps {
    station: BajsStation;
    onClose: () => void;
    onFlyTo?: () => void;
}

export function BikeStationInfoBar({
    station,
    onClose,
    onFlyTo
}: BikeStationInfoBarProps) {
    return (
        <div
            className="fixed top-16 sm:top-20 left-2 right-2 sm:left-4 sm:right-auto sm:w-80 z-[1050] bg-base-100 rounded-xl shadow-2xl border border-base-200"
            style={{ animation: 'modal-fade-in 0.2s ease-out' }}
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight text-base-content mb-1">
                            {station.name}
                        </h3>
                        <div className="text-xs text-base-content/60 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>Nextbike stanica</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {onFlyTo && (
                            <button
                                onClick={onFlyTo}
                                className="btn btn-ghost btn-circle btn-xs min-h-[32px] min-w-[32px]"
                                title="Prikaži na karti"
                            >
                                <Navigation className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="btn btn-ghost btn-circle btn-xs min-h-[32px] min-w-[32px]"
                            title="Zatvori"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-info/10 rounded-lg p-3 border border-info/20 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Bike className="w-4 h-4 text-info" />
                            <span className="text-xs font-semibold text-info uppercase tracking-wider">Bicikala</span>
                        </div>
                        <span className="text-2xl font-bold text-base-content">
                            {station.bikes_available_to_rent}
                        </span>
                    </div>

                    <div className="bg-success/10 rounded-lg p-3 border border-success/20 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 rounded-sm border-2 border-success flex items-center justify-center">
                                <div className="w-1 h-1 bg-success rounded-full"></div>
                            </div>
                            <span className="text-xs font-semibold text-success uppercase tracking-wider">Mjesta</span>
                        </div>
                        <span className="text-2xl font-bold text-base-content">
                            {station.free_racks}
                        </span>
                    </div>
                </div>

                {station.maintenance && (
                    <div className="mt-4 p-2 bg-warning/10 border border-warning/20 rounded-lg text-center">
                        <span className="text-xs text-warning font-medium italic">Stanica je trenutno u održavanju</span>
                    </div>
                )}

                <div className="mt-4 text-[10px] text-center text-base-content/40 italic">
                    Podaci preuzeti putem Nextbike API-ja
                </div>
            </div>
        </div>
    );
}

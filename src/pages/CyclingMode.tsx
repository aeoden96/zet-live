import { useState, useCallback } from 'react';
import { BaseMap } from '../components/Map/BaseMap';
import { BikeStations } from '../components/Map/BikeStations';
import { BikeParkings } from '../components/Map/BikeParkings';
import { BikePaths } from '../components/Map/BikePaths';
import { useNextbikeData, type BajsStation } from '../hooks/useNextbikeData';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSettingsStore } from '../stores/settingsStore';
import { BikeStationInfoBar } from '../components/common/BikeStationInfoBar';
import { ParentStationZoomController } from '../components/Map/ParentStationZoomController';

export function CyclingMode() {
    const { userLocation } = useGeolocation();
    const [legendOpen, setLegendOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState<BajsStation | null>(null);
    const [zoomTarget, setZoomTarget] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);

    const showBikeStations = useSettingsStore(s => s.showBikeStations);
    const showBikeParkings = useSettingsStore(s => s.showBikeParkings);
    const showBikePaths = useSettingsStore(s => s.showBikePaths);

    const { lastFetched } = useNextbikeData(showBikeStations);

    const handleStationClick = useCallback((station: BajsStation) => {
        setSelectedStation(station);
        setZoomTarget({ lat: station.lat, lon: station.lng, zoom: 17 });
    }, []);

    const handleCloseInfoBar = useCallback(() => {
        setSelectedStation(null);
    }, []);

    const handleFlyToStation = useCallback(() => {
        if (selectedStation) {
            setZoomTarget({ lat: selectedStation.lat, lon: selectedStation.lng, zoom: 17 });
        }
    }, [selectedStation]);

    const timeAgo = lastFetched
        ? Math.round((Date.now() - lastFetched) / 60000)
        : 0;

    return (
        <div className="h-full w-full relative">
            <BaseMap userLocation={userLocation}>
                <ParentStationZoomController
                    zoomTarget={zoomTarget}
                    onZoomComplete={() => setZoomTarget(null)}
                />
                <BikeStations
                    show={showBikeStations}
                    selectedStationId={selectedStation?.uid}
                    onStationClick={handleStationClick}
                />
                <BikeParkings show={showBikeParkings} />
                <BikePaths show={showBikePaths} />
            </BaseMap>

            {/* Station details bar */}
            {selectedStation && (
                <BikeStationInfoBar
                    station={selectedStation}
                    onClose={handleCloseInfoBar}
                    onFlyTo={handleFlyToStation}
                />
            )}

            {/* Floating Badges */}
            <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-end gap-2">
                {showBikePaths && legendOpen && (
                    <div className="bg-base-100 rounded-xl shadow-xl border border-base-200 p-3 w-64 text-xs space-y-2 mb-2">
                        <p className="font-semibold text-base-content mb-1">Legenda Biciklističkih Staza</p>

                        <div className="flex items-center gap-2">
                            <div className="w-5 h-1 bg-[#eab308]"></div>
                            <span className="text-base-content/80">Pješačko-biciklistička staza</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-1 bg-[#84cc16] border-b-2 border-dashed border-base-100"></div>
                            <span className="text-base-content/80">Nasip (Makadam)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-1 bg-[#22d3ee]"></div>
                            <span className="text-base-content/80">Biciklistička traka</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-1 bg-[#a855f7]"></div>
                            <span className="text-base-content/80">Cesta mješovitog prometa</span>
                        </div>
                    </div>
                )}

                {showBikePaths && (
                    <button
                        className="badge badge-warning gap-1 shadow cursor-pointer hover:badge-outline transition-all"
                        onClick={() => setLegendOpen((o) => !o)}
                    >
                        Legenda Staza
                    </button>
                )}

                {showBikeStations && (
                    <div className="badge badge-info gap-1 shadow">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        Ažurirano prije {timeAgo === 0 ? 'manje od 1' : timeAgo} min
                    </div>
                )}
            </div>
        </div>
    );
}



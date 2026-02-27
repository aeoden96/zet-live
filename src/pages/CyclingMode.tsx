import { BaseMap } from '../components/Map/BaseMap';
import { BikeStations } from '../components/Map/BikeStations';
import { BikeParkings } from '../components/Map/BikeParkings';
import { BikePaths } from '../components/Map/BikePaths';
import { useNavigationStore } from '../stores/navigationStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useState, useEffect } from 'react';
import { useNextbikeData } from '../hooks/useNextbikeData';

export function CyclingMode() {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [legendOpen, setLegendOpen] = useState(false);

    const setLocateAction = useNavigationStore(s => s.setLocateAction);
    const setLocatingStore = useNavigationStore(s => s.setLocating);

    const showBikeStations = useSettingsStore(s => s.showBikeStations);
    const showBikeParkings = useSettingsStore(s => s.showBikeParkings);
    const showBikePaths = useSettingsStore(s => s.showBikePaths);

    const { lastFetched } = useNextbikeData(showBikeStations);

    const timeAgo = lastFetched
        ? Math.round((Date.now() - lastFetched) / 60000)
        : 0;

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setLocatingStore(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                setLocatingStore(false);
            },
            () => setLocatingStore(false),
            { timeout: 8000, maximumAge: 30000 }
        );
    };

    useEffect(() => {
        setLocateAction(handleLocateMe);
        return () => setLocateAction(null);
    }, [setLocateAction]);

    return (
        <div className="h-full w-full relative">
            <BaseMap userLocation={userLocation}>
                <BikeStations show={showBikeStations} />
                <BikeParkings show={showBikeParkings} />
                <BikePaths show={showBikePaths} />
            </BaseMap>

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


import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import type { MapContainerProps } from 'react-leaflet';
import L from 'leaflet';
import { useSettingsStore } from '../../stores/settingsStore';
import { useEffect } from 'react';

/** Exposes the Leaflet map instance on window.__leafletMap for E2E tests. */
function MapTestRef() {
    const map = useMap();
    useEffect(() => {
        if (import.meta.env.DEV || import.meta.env.VITE_E2E === 'true') {
            (window as unknown as Record<string, unknown>).__leafletMap = map;
        }
        return () => {
            if ((window as unknown as Record<string, unknown>).__leafletMap === map) {
                delete (window as unknown as Record<string, unknown>).__leafletMap;
            }
        };
    }, [map]);
    return null;
}

const ZAGREB_CENTER: [number, number] = [45.815, 15.977];
const DEFAULT_ZOOM = 13;

const TILE_PROVIDERS = {
    osm: {
        // Use the HOT (Humanitarian) tile style which has slightly more detail
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.hotosm.org/">HOT</a>'
    },
    positron: {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    'dark-matter': {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
};

interface BaseMapProps extends MapContainerProps {
    children?: React.ReactNode;
    userLocation?: { lat: number; lon: number } | null;
}

function MapLocater({ userLocation }: { userLocation?: { lat: number; lon: number } | null }) {
    const map = useMap();
    useEffect(() => {
        if (userLocation) {
            map.flyTo([userLocation.lat, userLocation.lon], 16, { duration: 1.5 });
        }
    }, [userLocation, map]);
    return null;
}

export function BaseMap({ children, userLocation, ...mapProps }: BaseMapProps) {
    const theme = useSettingsStore((state) => state.theme);
    const detailedMap = useSettingsStore((state) => state.detailedMap);
    const providerId: keyof typeof TILE_PROVIDERS = detailedMap
        ? (theme === 'dark' ? 'dark-matter' : 'osm')
        : (theme === 'dark' ? 'dark-matter' : 'positron');
    const tileConfig = TILE_PROVIDERS[providerId];

    return (
        <MapContainer
            center={ZAGREB_CENTER}
            zoom={DEFAULT_ZOOM}
            minZoom={11}
            maxZoom={18}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            {...mapProps}
        >
            <TileLayer
                key={providerId}
                attribution={tileConfig.attribution}
                url={tileConfig.url}
            />

            {userLocation && (
                <Marker
                    position={[userLocation.lat, userLocation.lon]}
                    icon={L.divIcon({
                        html: `<div data-testid="user-location-marker" class="user-location-marker"><span class="pulse"></span><span class="dot"></span></div>`,
                        className: 'user-location-icon',
                        iconSize: [44, 44],
                        iconAnchor: [22, 22],
                    })}
                />
            )}

            <MapLocater userLocation={userLocation} />
            <MapTestRef />

            {children}
        </MapContainer>
    );
}

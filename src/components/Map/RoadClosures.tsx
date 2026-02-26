import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { RoadClosure } from '../../hooks/useRoadClosures';
import { useSettingsStore } from '../../stores/settingsStore';

interface RoadClosuresProps {
    show: boolean;
    closures: RoadClosure[];
}

export function RoadClosures({ show, closures }: RoadClosuresProps) {
    const theme = useSettingsStore((s) => s.theme);

    if (!show || closures.length === 0) return null;

    const lineColor = theme === 'dark' ? '#ef4444' : '#dc2626'; // Tailwind red-500 / red-600

    // Construction icon for point closures (if polyline has no/one point)
    const createConstructionIcon = () =>
        L.divIcon({
            html: `
        <div style="background-color: ${lineColor}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
      `,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

    return (
        <>
            {closures.map((closure) => {
                // If it's a valid polyline
                if (closure.polyline && closure.polyline.length > 1) {
                    return (
                        <Polyline
                            key={closure.id}
                            positions={closure.polyline}
                            pathOptions={{
                                color: lineColor,
                                weight: 6,
                                opacity: 0.8,
                                dashArray: '10, 10', // Dashed line to indicate under construction/closed
                            }}
                        >
                            <Popup className="road-closure-popup">
                                <div className="p-1">
                                    <h3 className="font-bold text-sm mb-1">{closure.streetName}</h3>
                                    {closure.crossStreet && (
                                        <p className="text-xs text-base-content/70 mb-2">Do: {closure.crossStreet}</p>
                                    )}
                                    <div className="text-xs space-y-1">
                                        <p><strong>Razlog:</strong> {closure.reason.replace('ROAD_CLOSED_CONSTRUCTION', 'Radovi').replace('ROAD_CLOSED', 'Zatvoreno')}</p>
                                        <p><strong>Smjer:</strong> {closure.direction === 'BOTH_DIRECTIONS' ? 'Oba smjera' : closure.direction}</p>
                                        {closure.endDate && (
                                            <p><strong>Zatvoreno do:</strong> {new Date(closure.endDate).toLocaleDateString('hr-HR')}</p>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Polyline>
                    );
                }

                // If it only has one point, show a marker instead
                if (closure.polyline && closure.polyline.length === 1) {
                    const point = closure.polyline[0];
                    return (
                        <Marker key={closure.id} position={point} icon={createConstructionIcon()}>
                            <Popup>
                                <div className="p-1">
                                    <h3 className="font-bold text-sm mb-1">{closure.streetName}</h3>
                                    {closure.crossStreet && (
                                        <p className="text-xs text-base-content/70 mb-2">Do: {closure.crossStreet}</p>
                                    )}
                                    <div className="text-xs space-y-1">
                                        <p><strong>Razlog:</strong> {closure.reason.replace('ROAD_CLOSED_CONSTRUCTION', 'Radovi').replace('ROAD_CLOSED', 'Zatvoreno')}</p>
                                        <p><strong>Smjer:</strong> {closure.direction === 'BOTH_DIRECTIONS' ? 'Oba smjera' : closure.direction}</p>
                                        {closure.endDate && (
                                            <p><strong>Zatvoreno do:</strong> {new Date(closure.endDate).toLocaleDateString('hr-HR')}</p>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                }

                return null;
            })}
        </>
    );
}

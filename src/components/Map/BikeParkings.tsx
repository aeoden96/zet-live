import { memo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Import our static parsed parkings data
import parkings from '../../data/bike_parkings.json';

interface ParkingData {
    id: number;
    lat: number;
    lng: number;
    name: string;
    stands: number;
    capacity: number;
}

interface BikeParkingsProps {
    show: boolean;
}

export const BikeParkings = memo(function BikeParkings({ show }: BikeParkingsProps) {
    if (!show || !parkings.length) return null;

    return (
        <>
            {(parkings as ParkingData[]).map((parking) => {
                // Determine icon based on stands or capacity
                const hasStands = parking.stands > 0;

                const iconHtml = `
          <div class="flex items-center justify-center w-6 h-6 rounded-md shadow-md text-white font-bold text-[11px]"
               style="background-color: ${hasStands ? '#10b981' : '#64748b'}; border: 1.5px solid white;">
            P
          </div>
        `;

                const icon = L.divIcon({
                    html: iconHtml,
                    className: 'bike-parking-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });

                return (
                    <Marker
                        key={`parking-${parking.id}`}
                        position={[parking.lat, parking.lng]}
                        icon={icon}
                        zIndexOffset={400}
                    >
                        <Tooltip direction="top" offset={[0, -12]} className="custom-tooltip shadow-lg">
                            <div className="text-sm font-semibold mb-1">{parking.name}</div>
                            <div className="flex gap-4 text-xs text-base-content/80">
                                <div>
                                    <span className="font-bold text-success">{parking.stands || '?'}</span>
                                    <span className="ml-1">stalaka</span>
                                </div>
                                {parking.capacity > 0 && (
                                    <div>
                                        <span className="font-bold text-info">{parking.capacity}</span>
                                        <span className="ml-1">mijesta za bicikle</span>
                                    </div>
                                )}
                            </div>
                        </Tooltip>
                    </Marker>
                );
            })}
        </>
    );
});

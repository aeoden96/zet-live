/**
 * Component to control map focus when stops are selected
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { Stop } from '../../utils/gtfs';

interface MapFocusControllerProps {
  selectedStopId: string | null;
  stops: Stop[];
}

export function MapFocusController({ selectedStopId, stops }: MapFocusControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedStopId) {
      const stop = stops.find(s => s.id === selectedStopId);
      if (stop) {
        map.flyTo([stop.lat, stop.lon], 17, {
          duration: 0.8,
          easeLinearity: 0.25
        });
      }
    }
  }, [selectedStopId, stops, map]);

  return null;
}

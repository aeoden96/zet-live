/**
 * Invisible component that lives inside MapContainer and reports
 * the current map bounds to the parent via a callback.
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';

interface MapBoundsTrackerProps {
  onBoundsChange: (bounds: LatLngBounds) => void;
}

export function MapBoundsTracker({ onBoundsChange }: MapBoundsTrackerProps) {
  const map = useMap();

  useEffect(() => {
    // Emit initial bounds
    onBoundsChange(map.getBounds());

    const handleMove = () => onBoundsChange(map.getBounds());
    map.on('moveend', handleMove);
    map.on('zoomend', handleMove);

    return () => {
      map.off('moveend', handleMove);
      map.off('zoomend', handleMove);
    };
  }, [map, onBoundsChange]);

  return null;
}

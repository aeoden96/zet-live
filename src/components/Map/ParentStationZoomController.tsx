/**
 * Component to handle zooming when parent stations are clicked
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface ParentStationZoomControllerProps {
  zoomTarget: { lat: number; lon: number; zoom?: number } | null;
  onZoomComplete: () => void;
}

export function ParentStationZoomController({ 
  zoomTarget, 
  onZoomComplete 
}: ParentStationZoomControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (zoomTarget) {
      // Zoom to provided level (fallback to 17)
      const targetZoom = zoomTarget.zoom ?? 17;
      map.flyTo([zoomTarget.lat, zoomTarget.lon], targetZoom, {
        duration: 0.8,
        easeLinearity: 0.25
      });
      
      // Clear the zoom target after animation completes
      const timer = setTimeout(() => {
        onZoomComplete();
      }, 1000); // Give time for animation to complete
      
      return () => clearTimeout(timer);
    }
  }, [zoomTarget, map, onZoomComplete]);

  return null;
}

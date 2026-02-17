/**
 * Component to handle zooming when parent stations are clicked
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface ParentStationZoomControllerProps {
  zoomTarget: { lat: number; lon: number } | null;
  onZoomComplete: () => void;
}

export function ParentStationZoomController({ 
  zoomTarget, 
  onZoomComplete 
}: ParentStationZoomControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (zoomTarget) {
      // Zoom to parent station location
      map.flyTo([zoomTarget.lat, zoomTarget.lon], 17, {
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

/**
 * Render route shape polylines on the map
 */

import { Polyline } from 'react-leaflet';

interface RouteShapeProps {
  shapes: Record<string, [number, number][]>;
  routeType: number | null;
}

export function RouteShape({ shapes, routeType }: RouteShapeProps) {
  // Tram: blue, Bus: orange/red
  const color = routeType === 0 ? '#2337ff' : '#ff6b35';
  
  return (
    <>
      {Object.entries(shapes).map(([shapeId, coordinates]) => (
        <Polyline
          key={shapeId}
          positions={coordinates}
          pathOptions={{
            color: color,
            weight: 4,
            opacity: 0.7,
          }}
        />
      ))}
    </>
  );
}

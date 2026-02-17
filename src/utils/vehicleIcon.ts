/**
 * Leaflet DivIcon factory for vehicle markers.
 *
 * When bearing is known → rotated arrow pointing in the direction of travel.
 * When bearing is unknown → plain filled circle (fallback).
 */
import L from 'leaflet';

/**
 * Build a Leaflet DivIcon for a vehicle marker.
 *
 * @param color   - Fill colour (hex) for the icon
 * @param bearing - Degrees clockwise from North; undefined → circle fallback
 * @param isRealtime - Whether this is a live GPS position (affects stroke colour)
 */
export function makeVehicleIcon(
  color: string,
  bearing: number | undefined,
  isRealtime: boolean,
): L.DivIcon {
  const stroke = isRealtime ? '#ffffff' : '#aaaaaa';

  if (bearing !== undefined) {
    // Arrow SVG: upward-pointing triangle, rotated to bearing.
    // viewBox is centred at 0,0 so CSS rotation pivots correctly.
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 20 20" width="24" height="24">
        <!-- simple, small isosceles triangle pointing up -->
        <polygon
          points="0,-7 5,6 -5,6"
          fill="${color}"
          stroke="${stroke}"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </svg>`;

    return L.divIcon({
      html: `<div style="transform:rotate(${bearing}deg);width:24px;height:24px;display:flex;align-items:center;justify-content:center;">${svg}</div>`,
      className: '',        // suppress Leaflet's default white box
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      tooltipAnchor: [0, -12],
    });
  }

  // Fallback: circle rendered as SVG so sizing/anchor match the arrow.
  const circleSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 20 20" width="20" height="20">
      <circle cx="0" cy="0" r="7"
        fill="${color}"
        fill-opacity="0.85"
        stroke="${stroke}"
        stroke-width="2"
      />
    </svg>`;

  return L.divIcon({
    html: circleSvg,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    tooltipAnchor: [0, -10],
  });
}

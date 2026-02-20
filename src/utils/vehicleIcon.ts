/**
 * Leaflet DivIcon factory for vehicle markers.
 *
 * All vehicles are displayed as a filled circle with the route short name inside.
 * When bearing is known a small triangular directional pin is added just outside
 * the circle, pointing in the direction of travel.
 */
import L from 'leaflet';

/**
 * Build a Leaflet DivIcon for a vehicle marker.
 *
 * @param color      - Fill colour (hex) for the icon
 * @param bearing    - Degrees clockwise from North; undefined → no directional pin
 * @param isRealtime - Whether this is a live GPS position (affects stroke colour)
 * @param label      - Route short name shown inside the circle
 */
export function makeVehicleIcon(
  color: string,
  bearing: number | undefined,
  isRealtime: boolean,
  label: string = '',
): L.DivIcon {
  const stroke = isRealtime ? '#ffffff' : '#aaaaaa';
  const len = label.length;
  const fontSize = len <= 1 ? 10 : len === 2 ? 9 : len === 3 ? 7 : 6;

  if (bearing !== undefined) {
    // Moving vehicle: circle with label + small directional pin.
    // The pin is a triangle sitting just outside the circle, pointing up in SVG
    // space (i.e. towards bearing after the rotation layer spins it).
    //
    // Layout (34×34 px, centre at 17,17):
    //   circle r=10, pin tip at (17,2), pin base at (14,7)–(20,7)
    const size = 34;
    const cx = size / 2; // 17
    const r = 10;
    const pinTipY   = cx - r - 5;      // 2
    const pinBaseY  = cx - r;           // 7
    const pinHalfW  = 3;

    const html =
      `<div style="position:relative;width:${size}px;height:${size}px;">` +
        // ── rotating layer: only the directional pin ──
        `<svg style="position:absolute;top:0;left:0;` +
             `transform:rotate(${bearing}deg);transform-origin:${cx}px ${cx}px;"` +
             ` width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
          `<polygon points="${cx},${pinTipY} ${cx - pinHalfW},${pinBaseY} ${cx + pinHalfW},${pinBaseY}"` +
                   ` fill="${color}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"/>` +
        `</svg>` +
        // ── fixed layer: circle + label ──
        `<svg style="position:absolute;top:0;left:0;"` +
             ` width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
          `<circle cx="${cx}" cy="${cx}" r="${r}"` +
                  ` fill="${color}" fill-opacity="0.95" stroke="${stroke}" stroke-width="2"/>` +
          `<text x="${cx}" y="${cx + Math.round(fontSize * 0.38)}"` +
                ` text-anchor="middle" font-size="${fontSize}" font-weight="bold"` +
                ` fill="white" font-family="system-ui,sans-serif">${label}</text>` +
        `</svg>` +
      `</div>`;

    return L.divIcon({
      html,
      className: '',
      iconSize: [size, size],
      iconAnchor: [cx, cx],
      tooltipAnchor: [0, -cx],
    });
  }

  // Stationary vehicle: plain circle with label, no pin.
  const size = 28;
  const cx = size / 2; // 14
  const r = 9;

  const html =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<circle cx="${cx}" cy="${cx}" r="${r}"` +
              ` fill="${color}" fill-opacity="0.85" stroke="${stroke}" stroke-width="2"/>` +
      `<text x="${cx}" y="${cx + Math.round(fontSize * 0.38)}"` +
            ` text-anchor="middle" font-size="${fontSize}" font-weight="bold"` +
            ` fill="white" font-family="system-ui,sans-serif">${label}</text>` +
    `</svg>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [cx, cx],
    tooltipAnchor: [0, -cx],
  });
}

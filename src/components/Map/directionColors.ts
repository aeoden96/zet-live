export function getDirectionColor(routeType: number | null, index: number): string {
  // Two-color palettes for tram (blue) and bus (orange), fall back to purple palette
  const palettes: Record<string, string[]> = {
    tram: ['#2337ff', '#1fb6ff', '#7fb3ff'],
    bus:  ['#ff6b35', '#ffb26b', '#ffd6b0'],
    mixed: ['#8242be', '#5e32a8', '#a36bd1']
  };

  let key = 'mixed';
  if (routeType === 0) key = 'tram';
  else if (routeType === 3) key = 'bus';

  const pal = palettes[key] || palettes['mixed'];
  return pal[index % pal.length];
}

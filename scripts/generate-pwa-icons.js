#!/usr/bin/env node

/**
 * Generate placeholder PWA icons
 * Simple script to create branded icons for the app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sizes = [192, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  
  <!-- ZET Letter -->
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.4}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central"
  >ZET</text>
  
  <!-- Subtitle -->
  <text 
    x="50%" 
    y="${size * 0.75}" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.08}" 
    fill="white" 
    text-anchor="middle" 
    opacity="0.9"
  >Live</text>
</svg>`;

  const filename = `pwa-${size}x${size}.svg`;
  const filepath = path.join(publicDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Generated ${filename}`);
});

console.log('\nPWA icons generated successfully!');
console.log('Note: These are placeholder SVG icons. For production, replace with proper PNG icons.');

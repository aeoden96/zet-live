#!/usr/bin/env node

/**
 * Generate PWA icons and screenshots as data URLs embedded in HTML files
 * This ensures they load properly without needing image generation libraries
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// Generate a simple square icon as SVG (properly formatted)
function generateIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text 
    x="50%" 
    y="48%" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="${size * 0.35}" 
    font-weight="700" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="middle"
    letter-spacing="-${size * 0.01}"
  >ZET</text>
  <text 
    x="50%" 
    y="72%" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="${size * 0.12}" 
    font-weight="500" 
    fill="white" 
    text-anchor="middle" 
    opacity="0.95"
  >LIVE</text>
</svg>`;
}

// Generate a screenshot as SVG
function generateScreenshot(width, height, label) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f8fafc"/>
  <rect width="${width}" height="${height * 0.08}" fill="#2563eb"/>
  <text 
    x="50%" 
    y="${height * 0.04}" 
    font-family="system-ui, sans-serif" 
    font-size="${height * 0.03}" 
    font-weight="600" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >ZET Live</text>
  
  <!-- Map placeholder -->
  <rect x="${width * 0.02}" y="${height * 0.12}" width="${width * 0.58}" height="${height * 0.85}" fill="#cbd5e1" rx="8"/>
  <text 
    x="${width * 0.31}" 
    y="${height * 0.54}" 
    font-family="system-ui, sans-serif" 
    font-size="${height * 0.03}" 
    fill="#64748b" 
    text-anchor="middle"
  >Map View</text>
  
  <!-- Sidebar placeholder -->
  <rect x="${width * 0.62}" y="${height * 0.12}" width="${width * 0.36}" height="${height * 0.85}" fill="white" rx="8"/>
  <rect x="${width * 0.64}" y="${height * 0.15}" width="${width * 0.32}" height="${height * 0.05}" fill="#e2e8f0" rx="4"/>
  <rect x="${width * 0.64}" y="${height * 0.22}" width="${width * 0.32}" height="${height * 0.05}" fill="#e2e8f0" rx="4"/>
  <rect x="${width * 0.64}" y="${height * 0.29}" width="${width * 0.32}" height="${height * 0.05}" fill="#e2e8f0" rx="4"/>
  
  <text 
    x="50%" 
    y="${height * 0.92}" 
    font-family="system-ui, sans-serif" 
    font-size="${height * 0.025}" 
    fill="#64748b" 
    text-anchor="middle"
  >${label}</text>
</svg>`;
}

// Create icon files
console.log('Generating PWA icons...');
const iconSizes = [192, 512];
iconSizes.forEach(size => {
  const svg = generateIcon(size);
  const filename = `pwa-${size}x${size}.svg`;
  const filepath = path.join(publicDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filename}`);
});

// Create maskable icon (with safe zone)
const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="180" 
    font-weight="700" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="middle"
    letter-spacing="-5"
  >ZET</text>
  <text 
    x="50%" 
    y="68%" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="60" 
    font-weight="500" 
    fill="white" 
    text-anchor="middle" 
    opacity="0.95"
  >LIVE</text>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'pwa-512x512-maskable.svg'), maskableSvg);
console.log('✓ Generated pwa-512x512-maskable.svg');

// Create screenshots
console.log('\nGenerating PWA screenshots...');
const screenshots = [
  { width: 1280, height: 720, name: 'screenshot-wide.svg', label: 'Desktop View' },
  { width: 750, height: 1334, name: 'screenshot-mobile.svg', label: 'Mobile View' }
];

screenshots.forEach(({ width, height, name, label }) => {
  const svg = generateScreenshot(width, height, label);
  const filepath = path.join(publicDir, name);
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${name}`);
});

console.log('\n✅ All PWA assets generated successfully!');

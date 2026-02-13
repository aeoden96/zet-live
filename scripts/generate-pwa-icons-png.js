#!/usr/bin/env node

/**
 * Generate PWA icons and screenshots as PNG files using sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// Generate a simple icon SVG
function generateIconSVG(size, maskable = false) {
  const padding = maskable ? size * 0.2 : 0;
  const contentSize = size - (padding * 2);
  const fontSize = contentSize * 0.35;
  const subtitleSize = contentSize * 0.12;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" ${!maskable ? `rx="${size * 0.15}"` : ''}/>
  <text 
    x="50%" 
    y="${size * 0.48}" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >ZET</text>
  <text 
    x="50%" 
    y="${size * 0.72}" 
    font-family="Arial, sans-serif" 
    font-size="${subtitleSize}" 
    font-weight="500" 
    fill="white" 
    text-anchor="middle" 
    opacity="0.95"
  >LIVE</text>
</svg>`;
}

// Generate a screenshot SVG
function generateScreenshotSVG(width, height) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f8fafc"/>
  <rect width="${width}" height="${height * 0.08}" fill="#2563eb"/>
  <text 
    x="50%" 
    y="${height * 0.04}" 
    font-family="Arial, sans-serif" 
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
    font-family="Arial, sans-serif" 
    font-size="${height * 0.03}" 
    fill="#64748b" 
    text-anchor="middle"
  >Map View</text>
  
  <!-- Sidebar placeholder -->
  <rect x="${width * 0.62}" y="${height * 0.12}" width="${width * 0.36}" height="${height * 0.85}" fill="white" rx="8"/>
  <rect x="${width * 0.64}" y="${height * 0.15}" width="${width * 0.32}" height="${height * 0.05}" fill="#e2e8f0" rx="4"/>
  <rect x="${width * 0.64}" y="${height * 0.22}" width="${width * 0.32}" height="${height * 0.05}" fill="#e2e8f0" rx="4"/>
  <rect x="${width * 0.64}" y="${height * 0.29}" width="${width * 0.32}" height="${height * 0.05}" fill="#e2e8f0" rx="4"/>
</svg>`;
}

async function generateIcons() {
  console.log('Generating PWA icons as PNG...');
  
  const icons = [
    { size: 192, name: 'pwa-192x192.png', maskable: false },
    { size: 512, name: 'pwa-512x512.png', maskable: false },
    { size: 512, name: 'pwa-512x512-maskable.png', maskable: true },
  ];
  
  for (const { size, name, maskable } of icons) {
    const svg = generateIconSVG(size, maskable);
    const filepath = path.join(publicDir, name);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filepath);
    
    console.log(`✓ Generated ${name}`);
  }
}

async function generateScreenshots() {
  console.log('\nGenerating PWA screenshots as PNG...');
  
  const screenshots = [
    { width: 1280, height: 720, name: 'screenshot-wide.png' },
    { width: 750, height: 1334, name: 'screenshot-mobile.png' }
  ];
  
  for (const { width, height, name } of screenshots) {
    const svg = generateScreenshotSVG(width, height);
    const filepath = path.join(publicDir, name);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filepath);
    
    console.log(`✓ Generated ${name}`);
  }
}

async function main() {
  try {
    await generateIcons();
    await generateScreenshots();
    console.log('\n✅ All PWA assets generated successfully!');
  } catch (error) {
    console.error('Error generating assets:', error);
    process.exit(1);
  }
}

main();

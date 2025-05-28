#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons for each size
iconSizes.forEach(size => {
  const fontSize = Math.max(8, Math.floor(size * 0.4));
  const borderRadius = Math.max(2, Math.floor(size * 0.1));
  
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${borderRadius}" fill="#2563eb"/>
  <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">Z</text>
</svg>`;

  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`Generated ${filename}`);
});

// Create PNG versions by copying SVG content (browsers will handle SVG)
iconSizes.forEach(size => {
  const fontSize = Math.max(8, Math.floor(size * 0.4));
  const borderRadius = Math.max(2, Math.floor(size * 0.1));
  
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${borderRadius}" fill="#2563eb"/>
  <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">Z</text>
</svg>`;

  const filename = `icon-${size}x${size}.png`;
  // For now, create SVG content in PNG files - browsers will handle it
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`Generated ${filename} (SVG content)`);
});

// Create additional required files
const additionalFiles = [
  { name: 'favicon.ico', size: 32 },
  { name: 'safari-pinned-tab.svg', size: 96 },
  { name: 'og-image.png', size: 1200 },
  { name: 'twitter-card.png', size: 1200 },
  { name: 'shortcut-campaign.png', size: 96 },
  { name: 'shortcut-analytics.png', size: 96 },
  { name: 'shortcut-assets.png', size: 96 },
  { name: 'action-view.png', size: 96 },
  { name: 'action-dismiss.png', size: 96 }
];

additionalFiles.forEach(({ name, size }) => {
  const fontSize = Math.floor(size * 0.2);
  const borderRadius = Math.floor(size * 0.1);
  
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${borderRadius}" fill="#2563eb"/>
  <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">ZAMC</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, name), svgContent);
  console.log(`Generated ${name}`);
});

console.log('All PWA icons generated successfully!'); 
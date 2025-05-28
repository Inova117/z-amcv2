#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

// Create additional required files
const additionalFiles = [
  'favicon.ico',
  'safari-pinned-tab.svg',
  'og-image.png',
  'twitter-card.png',
  'shortcut-campaign.png',
  'shortcut-analytics.png',
  'shortcut-assets.png',
  'action-view.png',
  'action-dismiss.png'
];

additionalFiles.forEach(filename => {
  const size = filename.includes('og-image') ? 1200 : filename.includes('twitter') ? 1200 : 96;
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.1)}" fill="#2563eb"/>
  <text x="${size/2}" y="${size/2 + size*0.1}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.3)}" font-weight="bold">ZAMC</text>
</svg>`;

  const filepath = path.join(iconsDir, filename.replace('.png', '.svg').replace('.ico', '.svg'));
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename} as SVG`);
});

console.log('All PWA icons generated successfully!'); 
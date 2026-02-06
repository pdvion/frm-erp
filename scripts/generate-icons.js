#!/usr/bin/env node
/* eslint-disable */
/**
 * Generate PWA placeholder icons as SVG files.
 * Replace these with proper PNG icons for production.
 * Usage: node scripts/generate-icons.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, "..", "public", "icons");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const fontSize = Math.round(size * 0.3);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#2563eb"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui, sans-serif" font-weight="700" font-size="${fontSize}" fill="white">
    FRM
  </text>
</svg>`;
  // Save as SVG (browsers accept SVG icons in manifest for dev)
  fs.writeFileSync(path.join(outDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
}

console.log("\\nDone! Replace SVGs with PNGs for production.");

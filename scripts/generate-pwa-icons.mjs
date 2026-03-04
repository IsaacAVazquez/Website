import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcImage = join(rootDir, 'public', 'favicon.png');
const outDir = join(rootDir, 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

for (const size of sizes) {
  const outFile = join(outDir, `icon-${size}x${size}.png`);
  await sharp(srcImage).resize(size, size).png().toFile(outFile);
  console.log(`Generated ${size}x${size} → public/icons/icon-${size}x${size}.png`);
}

console.log('Done — all PWA icons generated.');

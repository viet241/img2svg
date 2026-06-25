import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'public/icon.svg');
const iconsDir = path.join(projectRoot, 'public/icons');
const svg = readFileSync(svgPath);

mkdirSync(iconsDir, { recursive: true });

const publicIcons = [
    ['icon-192', 192],
    ['icon-512', 512],
    ['apple-touch-icon', 180],
];

for (const [name, size] of publicIcons) {
    const out = path.join(iconsDir, `${name}.png`);
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
    console.log(`Wrote public/icons/${name}.png`);
}

const faviconSizes = [16, 32, 48];
const faviconPngs = await Promise.all(
    faviconSizes.map((size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer())
);
const faviconOut = path.join(projectRoot, 'public/favicon.ico');
writeFileSync(faviconOut, await toIco(faviconPngs));
console.log('Wrote public/favicon.ico');

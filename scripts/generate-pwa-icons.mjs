import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const faviconLightSvgPath = path.join(projectRoot, 'public/icon-favicon-light.svg');
const faviconDarkSvgPath = path.join(projectRoot, 'public/icon-favicon-dark.svg');
const appSvgPath = path.join(projectRoot, 'public/icon-app.svg');
const iconsDir = path.join(projectRoot, 'public/icons');
const faviconLightSvg = readFileSync(faviconLightSvgPath);
const faviconDarkSvg = readFileSync(faviconDarkSvgPath);
const appSvg = readFileSync(appSvgPath);

const renderIcon = (svg, size) =>
    sharp(Buffer.from(svg))
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 });

mkdirSync(iconsDir, { recursive: true });

const faviconSizes = [16, 32, 48];

for (const size of [16, 32]) {
    await renderIcon(faviconLightSvg, size).toFile(path.join(iconsDir, `icon-${size}.png`));
    console.log(`Wrote public/icons/icon-${size}.png`);
    await renderIcon(faviconDarkSvg, size).toFile(path.join(iconsDir, `icon-${size}-dark.png`));
    console.log(`Wrote public/icons/icon-${size}-dark.png`);
}

const appIcons = [
    ['icon-192', 192],
    ['icon-512', 512],
    ['apple-touch-icon', 180],
];

for (const [name, size] of appIcons) {
    const out = path.join(iconsDir, `${name}.png`);
    await renderIcon(appSvg, size).toFile(out);
    console.log(`Wrote public/icons/${name}.png`);
}

const faviconLightPngs = await Promise.all(
    faviconSizes.map((size) => renderIcon(faviconLightSvg, size).toBuffer())
);
writeFileSync(path.join(projectRoot, 'public/favicon.ico'), await toIco(faviconLightPngs));
console.log('Wrote public/favicon.ico');

const faviconDarkPngs = await Promise.all(
    faviconSizes.map((size) => renderIcon(faviconDarkSvg, size).toBuffer())
);
writeFileSync(path.join(projectRoot, 'public/favicon-dark.ico'), await toIco(faviconDarkPngs));
console.log('Wrote public/favicon-dark.ico');

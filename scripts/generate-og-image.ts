import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageResponse } from '@vercel/og';
import React from 'react';
import { ShadcnRegistry5 } from './og/shadcn-registry-5';
import {
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_TITLE,
} from '../src/lib/site-config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

type FontWeight = 400 | 600 | 800;

async function loadInterFont(weight: FontWeight) {
    const fileName =
        weight === 400
            ? 'inter-latin-400-normal.woff'
            : weight === 600
              ? 'inter-latin-600-normal.woff'
              : 'inter-latin-800-normal.woff';

    const filePath = path.join(
        projectRoot,
        'node_modules',
        '@fontsource',
        'inter',
        'files',
        fileName
    );
    const data = await readFile(filePath);

    return {
        name: 'Inter',
        data,
        weight,
        style: 'normal' as const,
    };
}

async function loadLogoDataUrl(): Promise<string> {
    const iconPath = path.join(projectRoot, 'public', 'icons', 'icon-192.png');
    const buffer = await readFile(iconPath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function main() {
    const [regular, semibold, extrabold, logo] = await Promise.all([
        loadInterFont(400),
        loadInterFont(600),
        loadInterFont(800),
        loadLogoDataUrl(),
    ]);

    const response = new ImageResponse(
        React.createElement(ShadcnRegistry5, {
            name: SITE_NAME,
            title: SITE_TITLE,
            description: SITE_DESCRIPTION,
            logo,
        }),
        {
            width: 1200,
            height: 630,
            fonts: [regular, semibold, extrabold],
        }
    );

    const outputPath = path.join(projectRoot, 'public', 'og.png');
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, buffer);
    console.log(`Wrote ${outputPath} (${buffer.length} bytes)`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

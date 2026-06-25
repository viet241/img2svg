export interface PaletteColor {
    r: number;
    g: number;
    b: number;
    hex: string;
}

export interface QuantizeResult {
    palette: PaletteColor[];
    indices: Uint8Array;
}

function clampColorCount(colorCount: number): number {
    return Math.max(2, Math.min(8, Math.round(colorCount)));
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface RgbPixel {
    r: number;
    g: number;
    b: number;
}

function extractPixels(imageData: ImageData): RgbPixel[] {
    const pixels: RgbPixel[] = [];
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    if (pixels.length === 0) {
        pixels.push({ r: 255, g: 255, b: 255 });
    }

    return pixels;
}

function kMeans(pixels: RgbPixel[], k: number, maxIter = 12): PaletteColor[] {
    const centroids: RgbPixel[] = [];

    for (let i = 0; i < k; i++) {
        const p = pixels[Math.floor((i * pixels.length) / k)];
        centroids.push({ ...p });
    }

    for (let iter = 0; iter < maxIter; iter++) {
        const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }));

        for (const p of pixels) {
            let best = 0;
            let bestDist = Infinity;

            for (let c = 0; c < k; c++) {
                const dr = p.r - centroids[c].r;
                const dg = p.g - centroids[c].g;
                const db = p.b - centroids[c].b;
                const dist = dr * dr + dg * dg + db * db;
                if (dist < bestDist) {
                    bestDist = dist;
                    best = c;
                }
            }

            sums[best].r += p.r;
            sums[best].g += p.g;
            sums[best].b += p.b;
            sums[best].count++;
        }

        let moved = false;
        for (let c = 0; c < k; c++) {
            if (sums[c].count === 0) continue;
            const nr = sums[c].r / sums[c].count;
            const ng = sums[c].g / sums[c].count;
            const nb = sums[c].b / sums[c].count;
            if (nr !== centroids[c].r || ng !== centroids[c].g || nb !== centroids[c].b) {
                moved = true;
                centroids[c] = { r: nr, g: ng, b: nb };
            }
        }

        if (!moved) break;
    }

    return centroids.map((c) => ({
        r: Math.round(c.r),
        g: Math.round(c.g),
        b: Math.round(c.b),
        hex: rgbToHex(c.r, c.g, c.b),
    }));
}

function nearestPaletteIndex(r: number, g: number, b: number, palette: PaletteColor[]): number {
    let best = 0;
    let bestDist = Infinity;

    for (let i = 0; i < palette.length; i++) {
        const dr = r - palette[i].r;
        const dg = g - palette[i].g;
        const db = b - palette[i].b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
            bestDist = dist;
            best = i;
        }
    }

    return best;
}

export function quantizeImage(imageData: ImageData, colorCount: number): QuantizeResult {
    const k = clampColorCount(colorCount);
    const pixels = extractPixels(imageData);
    const palette = kMeans(pixels, k);
    const indices = new Uint8Array(imageData.width * imageData.height);
    const { data, width, height } = imageData;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const di = i * 4;
            if (data[di + 3] < 128) {
                indices[i] = 0;
                continue;
            }
            indices[i] = nearestPaletteIndex(data[di], data[di + 1], data[di + 2], palette);
        }
    }

    return { palette, indices };
}

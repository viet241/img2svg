import { describe, it, expect } from 'vitest';
import { quantizeImage } from '../src/utils/quantize';
import { traceColorLayers } from '../src/utils/layerTrace';

function twoColorImageData(w: number, h: number): ImageData {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const isRed = x < w / 2;
            data[i] = isRed ? 220 : 255;
            data[i + 1] = isRed ? 20 : 255;
            data[i + 2] = isRed ? 20 : 255;
            data[i + 3] = 255;
        }
    }
    return new ImageData(data, w, h);
}

describe('quantizeImage', () => {
    it('extracts 2 colors from red/white image', () => {
        const result = quantizeImage(twoColorImageData(8, 8), 2);
        expect(result.palette).toHaveLength(2);
        expect(result.indices).toHaveLength(64);
    });

    it('clamps color count between 2 and 8', () => {
        const img = twoColorImageData(4, 4);
        expect(quantizeImage(img, 1).palette.length).toBe(2);
        expect(quantizeImage(img, 20).palette.length).toBe(8);
    });
});

describe('traceColorLayers', () => {
    it('produces layers for 2-color quantized image', () => {
        const quantize = quantizeImage(twoColorImageData(12, 12), 2);
        const layers = traceColorLayers(quantize, 12, 12, {
            rdpEpsilon: 0.5,
            useBezier: false,
            noiseFilter: 2,
        });
        expect(layers.length).toBeGreaterThan(0);
        expect(layers[0].paths.length).toBeGreaterThan(0);
        expect(layers[0].color).toMatch(/^#[0-9a-f]{6}$/i);
    });
});

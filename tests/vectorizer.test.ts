import { describe, it, expect } from 'vitest';
import {
    preprocessImage,
    traceContours,
    linkSegments,
    rdpSimplify,
    buildPathString,
    type Point,
    type Segment,
} from '../src/utils/vectorizer';

function solidImageData(w: number, h: number, r: number, g: number, b: number): ImageData {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
    }
    return new ImageData(data, w, h);
}

describe('preprocessImage', () => {
    it('converts white to 255 gray with default contrast', () => {
        const { grayscale } = preprocessImage(solidImageData(2, 2, 255, 255, 255), 0, 20);
        expect(grayscale.every((v) => v === 255)).toBe(true);
    });

    it('converts black to 0 gray', () => {
        const { grayscale } = preprocessImage(solidImageData(2, 2, 0, 0, 0), 0, 20);
        expect(grayscale.every((v) => v === 0)).toBe(true);
    });

    it('applies brightness offset', () => {
        const { grayscale } = preprocessImage(solidImageData(1, 1, 100, 100, 100), 50, 0);
        expect(grayscale[0]).toBeGreaterThan(100);
    });
});

describe('traceContours', () => {
    it('traces a 2x2 black square on white background', () => {
        const w = 4;
        const h = 4;
        const gray = new Uint8Array(w * h).fill(255);
        gray[5] = gray[6] = gray[9] = gray[10] = 0;

        const segments = traceContours(gray, w, h, 128, false);
        expect(segments.length).toBeGreaterThan(0);
    });

    it('returns empty when image is uniform', () => {
        const gray = new Uint8Array(4).fill(255);
        expect(traceContours(gray, 2, 2, 128, false)).toHaveLength(0);
    });

    it('invert changes contour extraction for mixed image', () => {
        const w = 6;
        const h = 6;
        const gray = new Uint8Array(w * h).fill(255);
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                gray[y * w + x] = 0;
            }
        }

        const normal = traceContours(gray, w, h, 128, false);
        const inverted = traceContours(gray, w, h, 128, true);
        expect(normal.length).toBeGreaterThan(0);
        expect(inverted.length).toBeGreaterThan(0);
    });
});

describe('linkSegments', () => {
    it('links two segments into one continuous polyline', () => {
        const segments: Segment[] = [
            [{ x: 0, y: 0 }, { x: 1, y: 0 }],
            [{ x: 1, y: 0 }, { x: 2, y: 0 }],
        ];
        const loops = linkSegments(segments);
        expect(loops.length).toBeGreaterThan(0);
        expect(loops[0].length).toBeGreaterThanOrEqual(3);
    });
});

describe('rdpSimplify', () => {
    it('reduces collinear points with large epsilon', () => {
        const points: Point[] = Array.from({ length: 10 }, (_, i) => ({ x: i, y: 0 }));
        const simplified = rdpSimplify(points, 5);
        expect(simplified.length).toBe(2);
    });

    it('returns original when epsilon is 0', () => {
        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 0 },
        ];
        expect(rdpSimplify(points, 0)).toEqual(points);
    });
});

describe('buildPathString', () => {
    it('starts with M in polygon mode', () => {
        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
        ];
        const d = buildPathString(points, false);
        expect(d.startsWith('M')).toBe(true);
        expect(d).toContain('L');
    });

    it('contains Q in bezier mode', () => {
        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
        ];
        const d = buildPathString(points, true);
        expect(d).toContain('Q');
    });

    it('closes loop with Z when start and end are near', () => {
        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0.5, y: 0.5 },
        ];
        const d = buildPathString(points, false);
        expect(d.endsWith('Z')).toBe(true);
    });
});

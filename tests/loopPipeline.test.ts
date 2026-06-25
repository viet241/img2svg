import { describe, it, expect } from 'vitest';
import {
    isClosedLoop,
    isGiantSimplex,
    isImageFrameLoop,
    loopArea,
    traceContours,
    linkSegments,
    type Point,
} from '../src/utils/vectorizer';
import { processLoops } from '../src/utils/loopPipeline';

describe('isClosedLoop', () => {
    it('returns true when start and end meet within tolerance', () => {
        const loop: Point[] = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0.5, y: 0.5 },
        ];
        expect(isClosedLoop(loop)).toBe(true);
    });

    it('returns false for open polyline', () => {
        const loop: Point[] = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
        ];
        expect(isClosedLoop(loop)).toBe(false);
    });
});

describe('isGiantSimplex', () => {
    it('flags large low-point-count loops', () => {
        const triangle: Point[] = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 50, y: 100 },
            { x: 0, y: 0 },
        ];
        expect(loopArea(triangle)).toBeGreaterThan(0);
        expect(isGiantSimplex(triangle, 100, 100)).toBe(true);
    });

    it('ignores small triangles', () => {
        const triangle: Point[] = [
            { x: 0, y: 0 },
            { x: 5, y: 0 },
            { x: 2, y: 5 },
            { x: 0, y: 0 },
        ];
        expect(isGiantSimplex(triangle, 100, 100)).toBe(false);
    });
});

describe('processLoops', () => {
    it('drops dangerous open loops in fill mode', () => {
        const loops: Point[][] = [[
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
        ]];

        const result = processLoops(loops, {
            noiseFilter: 2,
            rdpEpsilon: 0,
            useBezier: false,
            isFillMode: true,
            imageWidth: 100,
            imageHeight: 100,
        });

        expect(result.paths).toHaveLength(0);
        expect(result.filteredCount).toBe(1);
    });

    it('keeps small open loops in fill mode for evenodd compound paths', () => {
        const loops: Point[][] = [[
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
        ]];

        const result = processLoops(loops, {
            noiseFilter: 2,
            rdpEpsilon: 0,
            useBezier: false,
            isFillMode: true,
            imageWidth: 100,
            imageHeight: 100,
        });

        expect(result.paths).toHaveLength(1);
        expect(result.paths[0]).not.toContain('Z');
    });

    it('keeps open loops in stroke mode', () => {
        const loops: Point[][] = [[
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 50 },
        ]];

        const result = processLoops(loops, {
            noiseFilter: 2,
            rdpEpsilon: 0,
            useBezier: false,
            isFillMode: false,
            imageWidth: 100,
            imageHeight: 100,
        });

        expect(result.paths).toHaveLength(1);
        expect(result.paths[0]).not.toContain('Z');
    });

    it('keeps closed loops in fill mode', () => {
        const loops: Point[][] = [[
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 20 },
            { x: 0, y: 20 },
            { x: 0, y: 0 },
        ]];

        const result = processLoops(loops, {
            noiseFilter: 2,
            rdpEpsilon: 0,
            useBezier: false,
            isFillMode: true,
            imageWidth: 100,
            imageHeight: 100,
        });

        expect(result.paths).toHaveLength(1);
        expect(result.paths[0]).toContain('Z');
    });
});

describe('isImageFrameLoop', () => {
    it('flags a loop that spans the full image border', () => {
        const frame: Point[] = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            { x: 0, y: 0 },
        ];
        expect(isImageFrameLoop(frame, 100, 100)).toBe(true);
    });

    it('allows a small centered shape', () => {
        const square: Point[] = [
            { x: 40, y: 40 },
            { x: 60, y: 40 },
            { x: 60, y: 60 },
            { x: 40, y: 60 },
            { x: 40, y: 40 },
        ];
        expect(isImageFrameLoop(square, 100, 100)).toBe(false);
    });
});

describe('BW fill regression', () => {
    it('does not keep a loop covering most of the canvas for a small center square', () => {
        const w = 100;
        const h = 100;
        const gray = new Uint8Array(w * h).fill(255);
        for (let y = 40; y < 60; y++) {
            for (let x = 40; x < 60; x++) {
                gray[y * w + x] = 0;
            }
        }

        const segments = traceContours(gray, w, h, 128, false);
        const loops = linkSegments(segments);
        const result = processLoops(loops, {
            noiseFilter: 4,
            rdpEpsilon: 1,
            useBezier: true,
            isFillMode: true,
            imageWidth: w,
            imageHeight: h,
        });

        const imageArea = w * h;
        for (const loop of result.finalLoops) {
            expect(loopArea(loop)).toBeLessThan(imageArea * 0.5);
        }
        expect(result.paths.length).toBeGreaterThan(0);
    });
});

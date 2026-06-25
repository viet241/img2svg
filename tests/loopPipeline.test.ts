import { describe, it, expect } from 'vitest';
import { isClosedLoop, isGiantSimplex, loopArea, type Point } from '../src/utils/vectorizer';
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
    it('drops open loops in fill mode', () => {
        const loops: Point[][] = [[
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 50 },
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

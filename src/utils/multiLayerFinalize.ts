import { traceContours, linkSegments } from './vectorizer';
import { processLoops } from './loopPipeline';
import type { VectorLayer } from '../types/vectorizer';

export interface LayerTraceOptions {
    rdpEpsilon: number;
    useBezier: boolean;
    noiseFilter: number;
    isFillMode: boolean;
}

interface TracedColorLayer {
    area: number;
    layer: VectorLayer;
}

function countPalettePixels(indices: Uint8Array, colorIndex: number): number {
    let area = 0;
    for (let i = 0; i < indices.length; i++) {
        if (indices[i] === colorIndex) {
            area++;
        }
    }
    return area;
}

export function buildCanvasRectPath(width: number, height: number): string {
    return `M 0 0 H ${width} V ${height} H 0 Z`;
}

export function finalizeMultiFillLayers(
    traced: TracedColorLayer[],
    width: number,
    height: number,
    isFillMode: boolean,
): VectorLayer[] {
    if (traced.length === 0) {
        return [];
    }

    if (isFillMode) {
        const dominantArea = Math.max(...traced.map((entry) => entry.area));
        const canvasRect = buildCanvasRectPath(width, height);

        for (const entry of traced) {
            if (entry.area === dominantArea) {
                entry.layer.paths.unshift(canvasRect);
            }
        }
    }

    return traced
        .sort((a, b) => b.area - a.area)
        .map((entry) => entry.layer);
}

export function tracePaletteLayers(
    indices: Uint8Array,
    palette: { hex: string }[],
    width: number,
    height: number,
    options: LayerTraceOptions,
): { layers: VectorLayer[]; rawSegmentsCount: number } {
    const traced: TracedColorLayer[] = [];
    let rawSegmentsCount = 0;

    for (let c = 0; c < palette.length; c++) {
        const area = countPalettePixels(indices, c);
        if (area === 0) {
            continue;
        }

        const mask = new Uint8Array(width * height);
        for (let i = 0; i < indices.length; i++) {
            mask[i] = indices[i] === c ? 0 : 255;
        }

        const segments = traceContours(mask, width, height, 128, false);
        rawSegmentsCount += segments.length;
        const loops = linkSegments(segments);
        const { paths, totalPoints } = processLoops(loops, {
            noiseFilter: options.noiseFilter,
            rdpEpsilon: options.rdpEpsilon,
            useBezier: options.useBezier,
            isFillMode: options.isFillMode,
            imageWidth: width,
            imageHeight: height,
        });

        if (paths.length > 0) {
            traced.push({
                area,
                layer: {
                    color: palette[c].hex,
                    paths,
                    pointCount: totalPoints,
                },
            });
        }
    }

    return {
        layers: finalizeMultiFillLayers(traced, width, height, options.isFillMode),
        rawSegmentsCount,
    };
}

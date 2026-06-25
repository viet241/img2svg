import { traceContours, linkSegments } from './vectorizer';
import { processLoops } from './loopPipeline';
import type { QuantizeResult } from './quantize';
import type { VectorLayer } from '../types/vectorizer';

export interface LayerTraceOptions {
    rdpEpsilon: number;
    useBezier: boolean;
    noiseFilter: number;
    isFillMode: boolean;
}

export function traceColorLayers(
    quantize: QuantizeResult,
    width: number,
    height: number,
    options: LayerTraceOptions,
): VectorLayer[] {
    const { palette, indices } = quantize;
    const layers: VectorLayer[] = [];

    for (let c = 0; c < palette.length; c++) {
        const mask = new Uint8Array(width * height);
        for (let i = 0; i < indices.length; i++) {
            mask[i] = indices[i] === c ? 0 : 255;
        }

        const segments = traceContours(mask, width, height, 128, false);
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
            layers.push({
                color: palette[c].hex,
                paths,
                pointCount: totalPoints,
            });
        }
    }

    return layers;
}

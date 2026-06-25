import { traceContours, linkSegments, rdpSimplify, buildPathString } from './vectorizer';
import type { QuantizeResult } from './quantize';
import type { VectorLayer } from '../types/vectorizer';

export interface LayerTraceOptions {
    rdpEpsilon: number;
    useBezier: boolean;
    noiseFilter: number;
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
        const paths: string[] = [];
        let pointCount = 0;

        for (const loop of loops) {
            if (loop.length < options.noiseFilter) continue;

            const simplified = rdpSimplify(loop, options.rdpEpsilon);
            if (simplified.length < 2) continue;

            pointCount += simplified.length;
            const dStr = buildPathString(simplified, options.useBezier);
            if (dStr) paths.push(dStr);
        }

        if (paths.length > 0) {
            layers.push({
                color: palette[c].hex,
                paths,
                pointCount,
            });
        }
    }

    return layers;
}

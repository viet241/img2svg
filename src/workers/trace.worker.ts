import { traceContours, linkSegments, rdpSimplify, buildPathString, type Point } from '../utils/vectorizer';
import type { VectorLayer } from '../types/vectorizer';

export interface BwTraceRequest {
    id: number;
    mode: 'bw';
    grayscale: Uint8Array;
    width: number;
    height: number;
    threshold: number;
    invert: boolean;
}

export interface MultiTraceRequest {
    id: number;
    mode: 'multi';
    indices: Uint8Array;
    palette: { hex: string }[];
    width: number;
    height: number;
    rdpEpsilon: number;
    useBezier: boolean;
    noiseFilter: number;
}

export type TraceRequest = BwTraceRequest | MultiTraceRequest;

export interface BwTraceResponse {
    id: number;
    mode: 'bw';
    segments: ReturnType<typeof traceContours>;
    loops: Point[][];
}

export interface MultiTraceResponse {
    id: number;
    mode: 'multi';
    layers: VectorLayer[];
    rawSegmentsCount: number;
}

export type TraceResponse = BwTraceResponse | MultiTraceResponse;

function traceMultiLayers(req: MultiTraceRequest): MultiTraceResponse {
    const { indices, palette, width, height, rdpEpsilon, useBezier, noiseFilter } = req;
    const layers: VectorLayer[] = [];
    let rawSegmentsCount = 0;

    for (let c = 0; c < palette.length; c++) {
        const mask = new Uint8Array(width * height);
        for (let i = 0; i < indices.length; i++) {
            mask[i] = indices[i] === c ? 0 : 255;
        }

        const segments = traceContours(mask, width, height, 128, false);
        rawSegmentsCount += segments.length;
        const loops = linkSegments(segments);
        const paths: string[] = [];
        let pointCount = 0;

        for (const loop of loops) {
            if (loop.length < noiseFilter) continue;
            const simplified = rdpSimplify(loop, rdpEpsilon);
            if (simplified.length < 2) continue;
            pointCount += simplified.length;
            const dStr = buildPathString(simplified, useBezier);
            if (dStr) paths.push(dStr);
        }

        if (paths.length > 0) {
            layers.push({ color: palette[c].hex, paths, pointCount });
        }
    }

    return { id: req.id, mode: 'multi', layers, rawSegmentsCount };
}

self.onmessage = (e: MessageEvent<TraceRequest>) => {
    const req = e.data;

    if (req.mode === 'bw') {
        const segments = traceContours(req.grayscale, req.width, req.height, req.threshold, req.invert);
        const loops = linkSegments(segments);
        const response: BwTraceResponse = { id: req.id, mode: 'bw', segments, loops };
        self.postMessage(response);
        return;
    }

    const response = traceMultiLayers(req);
    self.postMessage(response);
};

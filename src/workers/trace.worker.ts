import { traceContours, linkSegments } from '../utils/vectorizer';
import { tracePaletteLayers } from '../utils/multiLayerFinalize';
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
    isFillMode: boolean;
}

export type TraceRequest = BwTraceRequest | MultiTraceRequest;

export interface BwTraceResponse {
    id: number;
    mode: 'bw';
    segments: ReturnType<typeof traceContours>;
    loops: import('../utils/vectorizer').Point[][];
}

export interface MultiTraceResponse {
    id: number;
    mode: 'multi';
    layers: VectorLayer[];
    rawSegmentsCount: number;
}

export type TraceResponse = BwTraceResponse | MultiTraceResponse;

function traceMultiLayers(req: MultiTraceRequest): MultiTraceResponse {
    const { layers, rawSegmentsCount } = tracePaletteLayers(
        req.indices,
        req.palette,
        req.width,
        req.height,
        {
            rdpEpsilon: req.rdpEpsilon,
            useBezier: req.useBezier,
            noiseFilter: req.noiseFilter,
            isFillMode: req.isFillMode,
        },
    );

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

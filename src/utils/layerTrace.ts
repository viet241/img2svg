import type { QuantizeResult } from './quantize';
import type { VectorLayer } from '../types/vectorizer';
import { tracePaletteLayers, type LayerTraceOptions } from './multiLayerFinalize';

export type { LayerTraceOptions } from './multiLayerFinalize';
export { buildCanvasRectPath, finalizeMultiFillLayers } from './multiLayerFinalize';

export function traceColorLayers(
    quantize: QuantizeResult,
    width: number,
    height: number,
    options: LayerTraceOptions,
): VectorLayer[] {
    return tracePaletteLayers(quantize.indices, quantize.palette, width, height, options).layers;
}

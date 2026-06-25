export type { Point, Segment } from '../utils/vectorizer';

export type ViewMode = 'sideBySide' | 'vectorOnly' | 'thresholdOnly';

export type ColorMode = 'bw' | 'multi';

export interface VectorStats {
    rawSegmentsCount: number;
    totalPathsCount: number;
    finalPathsCount: number;
    totalPointsCount: number;
    filteredCount: number;
    layerCount?: number;
    paletteCount?: number;
}

export interface VectorLayer {
    color: string;
    paths: string[];
    pointCount: number;
}

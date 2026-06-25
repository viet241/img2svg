import { useState, useEffect, useMemo, useRef } from 'react';
import {
    preprocessImage,
    traceContours,
    linkSegments,
    rdpSimplify,
    buildPathString,
    type Point,
} from '../utils/vectorizer';
import { quantizeImage } from '../utils/quantize';
import { buildBwSvg, buildMultiColorSvg } from '../utils/svgBuilder';
import { updateGrayscaleCanvas } from '../utils/previewUtils';
import type { VectorLayer, VectorStats } from '../types/vectorizer';
import type { VectorSettings } from './useVectorSettings';
import type { TraceResponse } from '../workers/trace.worker';
import TraceWorker from '../workers/trace.worker?worker';

let sharedWorker: Worker | null = null;

function getTraceWorker(): Worker | null {
    if (typeof Worker === 'undefined') return null;
    if (!sharedWorker) {
        try {
            sharedWorker = new TraceWorker();
        } catch {
            return null;
        }
    }
    return sharedWorker;
}

function processLoops(
    loops: Point[][],
    settings: Pick<VectorSettings, 'noiseFilter' | 'rdpEpsilon' | 'useBezier'>,
): { finalLoops: Point[][]; paths: string[]; totalPoints: number; filteredCount: number } {
    const finalLoops: Point[][] = [];
    const paths: string[] = [];
    let totalPoints = 0;
    let filteredCount = 0;

    for (const loop of loops) {
        if (loop.length < settings.noiseFilter) {
            filteredCount++;
            continue;
        }

        const simplified = rdpSimplify(loop, settings.rdpEpsilon);
        if (simplified.length >= 2) {
            finalLoops.push(simplified);
            totalPoints += simplified.length;
            const dStr = buildPathString(simplified, settings.useBezier);
            if (dStr) paths.push(dStr);
        }
    }

    return { finalLoops, paths, totalPoints, filteredCount };
}

export interface UseVectorPipelineInput {
    originalImageData: ImageData | null;
    imageWidth: number;
    imageHeight: number;
    settings: VectorSettings;
}

export function useVectorPipeline({
    originalImageData,
    imageWidth,
    imageHeight,
    settings,
}: UseVectorPipelineInput) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [usingWorker, setUsingWorker] = useState(false);
    const [stats, setStats] = useState<VectorStats | null>(null);
    const [simplifiedLoops, setSimplifiedLoops] = useState<Point[][]>([]);
    const [vectorLayers, setVectorLayers] = useState<VectorLayer[]>([]);
    const [svgContent, setSvgContent] = useState('');

    const requestIdRef = useRef(0);
    const workerRef = useRef<Worker | null>(getTraceWorker());

    const {
        brightness,
        contrast,
        threshold,
        rdpEpsilon,
        useBezier,
        invertColors,
        isFillMode,
        strokeWidth,
        vectorColor,
        backgroundColor,
        useTransparentBg,
        noiseFilter,
        colorMode,
        colorCount,
        setExtractedPalette,
    } = settings;

    useEffect(() => {
        if (!originalImageData || imageWidth === 0 || imageHeight === 0) return;

        const currentId = ++requestIdRef.current;
        setIsProcessing(true);

        const timer = window.setTimeout(() => {
            const run = async () => {
                try {
                    const { grayscale } = preprocessImage(originalImageData, brightness, contrast);
                    updateGrayscaleCanvas(grayscale, imageWidth, imageHeight, threshold, invertColors);

                    const worker = workerRef.current;

                    if (colorMode === 'multi') {
                        const quantize = quantizeImage(originalImageData, colorCount);
                        setExtractedPalette(quantize.palette);

                        if (worker) {
                            setUsingWorker(true);
                            const indicesCopy = new Uint8Array(quantize.indices);
                            const response = await new Promise<TraceResponse>((resolve, reject) => {
                                const onMessage = (e: MessageEvent<TraceResponse>) => {
                                    if (e.data.id !== currentId) return;
                                    worker.removeEventListener('message', onMessage);
                                    worker.removeEventListener('error', onError);
                                    resolve(e.data);
                                };
                                const onError = (err: ErrorEvent) => {
                                    worker.removeEventListener('message', onMessage);
                                    worker.removeEventListener('error', onError);
                                    reject(err);
                                };
                                worker.addEventListener('message', onMessage);
                                worker.addEventListener('error', onError);
                                worker.postMessage({
                                    id: currentId,
                                    mode: 'multi',
                                    indices: indicesCopy,
                                    palette: quantize.palette,
                                    width: imageWidth,
                                    height: imageHeight,
                                    rdpEpsilon,
                                    useBezier,
                                    noiseFilter,
                                }, [indicesCopy.buffer]);
                            });

                            if (response.id !== currentId) return;

                            if (response.mode === 'multi') {
                                const layers = response.layers;
                                setVectorLayers(layers);
                                setSimplifiedLoops([]);
                                setSvgContent(buildMultiColorSvg({
                                    width: imageWidth,
                                    height: imageHeight,
                                    layers,
                                    backgroundColor,
                                    useTransparentBg,
                                    isFillMode,
                                    strokeWidth,
                                }));
                                const totalPoints = layers.reduce((s, l) => s + l.pointCount, 0);
                                setStats({
                                    rawSegmentsCount: response.rawSegmentsCount,
                                    totalPathsCount: layers.reduce((s, l) => s + l.paths.length, 0),
                                    finalPathsCount: layers.reduce((s, l) => s + l.paths.length, 0),
                                    totalPointsCount: totalPoints,
                                    filteredCount: 0,
                                    layerCount: layers.length,
                                    paletteCount: quantize.palette.length,
                                });
                            }
                            return;
                        }

                        setUsingWorker(false);
                        const { traceColorLayers } = await import('../utils/layerTrace');
                        const layers = traceColorLayers(quantize, imageWidth, imageHeight, {
                            rdpEpsilon,
                            useBezier,
                            noiseFilter,
                        });
                        setVectorLayers(layers);
                        setSimplifiedLoops([]);
                        setSvgContent(buildMultiColorSvg({
                            width: imageWidth,
                            height: imageHeight,
                            layers,
                            backgroundColor,
                            useTransparentBg,
                            isFillMode,
                            strokeWidth,
                        }));
                        setStats({
                            rawSegmentsCount: 0,
                            totalPathsCount: layers.reduce((s, l) => s + l.paths.length, 0),
                            finalPathsCount: layers.reduce((s, l) => s + l.paths.length, 0),
                            totalPointsCount: layers.reduce((s, l) => s + l.pointCount, 0),
                            filteredCount: 0,
                            layerCount: layers.length,
                            paletteCount: quantize.palette.length,
                        });
                        return;
                    }

                    setVectorLayers([]);

                    let loops: Point[][] = [];
                    let segmentsCount = 0;

                    if (worker) {
                        setUsingWorker(true);
                        const grayCopy = new Uint8Array(grayscale);
                        const response = await new Promise<TraceResponse>((resolve, reject) => {
                            const onMessage = (e: MessageEvent<TraceResponse>) => {
                                if (e.data.id !== currentId) return;
                                worker.removeEventListener('message', onMessage);
                                worker.removeEventListener('error', onError);
                                resolve(e.data);
                            };
                            const onError = (err: ErrorEvent) => {
                                worker.removeEventListener('message', onMessage);
                                worker.removeEventListener('error', onError);
                                reject(err);
                            };
                            worker.addEventListener('message', onMessage);
                            worker.addEventListener('error', onError);
                            worker.postMessage({
                                id: currentId,
                                mode: 'bw',
                                grayscale: grayCopy,
                                width: imageWidth,
                                height: imageHeight,
                                threshold,
                                invert: invertColors,
                            }, [grayCopy.buffer]);
                        });

                        if (response.id !== currentId) return;

                        if (response.mode === 'bw') {
                            loops = response.loops;
                            segmentsCount = response.segments.length;
                        }
                    } else {
                        setUsingWorker(false);
                        const segments = traceContours(grayscale, imageWidth, imageHeight, threshold, invertColors);
                        segmentsCount = segments.length;
                        loops = linkSegments(segments);
                    }

                    const { finalLoops, paths, totalPoints, filteredCount } = processLoops(loops, {
                        noiseFilter,
                        rdpEpsilon,
                        useBezier,
                    });

                    setSimplifiedLoops(finalLoops);
                    setSvgContent(buildBwSvg({
                        width: imageWidth,
                        height: imageHeight,
                        paths,
                        vectorColor,
                        backgroundColor,
                        useTransparentBg,
                        isFillMode,
                        strokeWidth,
                    }));
                    setStats({
                        rawSegmentsCount: segmentsCount,
                        totalPathsCount: loops.length,
                        finalPathsCount: finalLoops.length,
                        totalPointsCount: totalPoints,
                        filteredCount,
                    });
                } catch (err) {
                    console.error('Vector pipeline error:', err);
                    workerRef.current = null;
                    sharedWorker = null;
                } finally {
                    if (currentId === requestIdRef.current) {
                        setIsProcessing(false);
                    }
                }
            };

            void run();
        }, 80);

        return () => window.clearTimeout(timer);
    }, [
        originalImageData,
        imageWidth,
        imageHeight,
        brightness,
        contrast,
        threshold,
        rdpEpsilon,
        useBezier,
        invertColors,
        isFillMode,
        strokeWidth,
        vectorColor,
        backgroundColor,
        useTransparentBg,
        noiseFilter,
        colorMode,
        colorCount,
        setExtractedPalette,
    ]);

    const reactPaths = useMemo(
        () => simplifiedLoops.map((loop) => buildPathString(loop, useBezier)),
        [simplifiedLoops, useBezier],
    );

    return {
        isProcessing,
        usingWorker,
        stats,
        simplifiedLoops,
        vectorLayers,
        svgContent,
        reactPaths,
    };
}

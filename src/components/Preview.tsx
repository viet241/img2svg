import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    FileImage,
    RefreshCw,
    SlidersHorizontal,
    Cpu,
    Eye,
    Layers,
} from 'lucide-react';
import type { ViewMode, VectorLayer, VectorStats } from '../types/vectorizer';
import type { Point } from '../utils/vectorizer';
import { ZoomPanViewport, type PanOffset } from './ZoomPanViewport';
import { ZoomSlider, ZOOM_MIN, ZOOM_MAX } from './ZoomSlider';
import { drawBinaryPreview, type BinaryPreview } from '../utils/previewUtils';
import { useI18n } from '../i18n/context';

const SIDE_BY_SIDE_MAX = 350;
const CHECKERBOARD_CLASS =
    'absolute inset-0 bg-[radial-gradient(#94a3b8_1.25px,transparent_1.25px)] [background-size:16px_16px] opacity-75 pointer-events-none';

function getSideBySideDisplaySize(width: number, height: number) {
    if (!width || !height) {
        return { width: SIDE_BY_SIDE_MAX, height: SIDE_BY_SIDE_MAX };
    }
    const scale = Math.min(SIDE_BY_SIDE_MAX / width, SIDE_BY_SIDE_MAX / height);
    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
    };
}

function BinaryThresholdCanvas({
    preview,
    className,
}: {
    preview: BinaryPreview;
    className?: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawBinaryPreview(canvas, preview);
    }, [preview]);

    return <canvas ref={canvasRef} className={className} />;
}

interface PreviewProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onZoomReset: () => void;
    showAnchors: boolean;
    onShowAnchorsChange: (v: boolean) => void;
    showCheckerboard: boolean;
    onShowCheckerboardChange: (v: boolean) => void;
    imageSrc: string | null;
    imageWidth: number;
    imageHeight: number;
    reactPaths: string[];
    simplifiedLoops: Point[][];
    vectorLayers: VectorLayer[];
    colorMode: 'bw' | 'multi';
    vectorColor: string;
    backgroundColor: string;
    useTransparentBg: boolean;
    isFillMode: boolean;
    strokeWidth: number;
    isProcessing: boolean;
    usingWorker: boolean;
    stats: VectorStats | null;
    binaryPreview: BinaryPreview | null;
}

function VectorSvgContent({
    imageWidth,
    imageHeight,
    colorMode,
    reactPaths,
    vectorLayers,
    vectorColor,
    backgroundColor,
    useTransparentBg,
    isFillMode,
    strokeWidth,
    simplifiedLoops,
    showAnchors,
}: Pick<
    PreviewProps,
    | 'imageWidth' | 'imageHeight' | 'colorMode' | 'reactPaths' | 'vectorLayers'
    | 'vectorColor' | 'backgroundColor' | 'useTransparentBg' | 'isFillMode'
    | 'strokeWidth' | 'simplifiedLoops' | 'showAnchors'
>) {
    return (
        <svg
            viewBox={`0 0 ${imageWidth} ${imageHeight}`}
            className="w-full h-full object-contain select-none"
            style={{ backgroundColor: useTransparentBg ? 'transparent' : backgroundColor }}
        >
            {colorMode === 'multi' ? (
                vectorLayers.flatMap((layer, lIdx) =>
                    isFillMode ? (
                        <path
                            key={`fill-${lIdx}`}
                            d={layer.paths.join(' ')}
                            fill={layer.color}
                            fillRule="evenodd"
                            stroke="none"
                        />
                    ) : (
                        layer.paths.map((dStr, pIdx) => (
                            <path
                                key={`stroke-${lIdx}-${pIdx}`}
                                d={dStr}
                                fill="none"
                                stroke={layer.color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ))
                    )
                )
            ) : isFillMode ? (
                <path
                    d={reactPaths.join(' ')}
                    fill={vectorColor}
                    fillRule="evenodd"
                    stroke="none"
                />
            ) : (
                reactPaths.map((dStr, idx) => (
                    <path
                        key={idx}
                        d={dStr}
                        fill="none"
                        stroke={vectorColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))
            )}

            {showAnchors && colorMode === 'bw' && simplifiedLoops.map((loop, lIdx) =>
                loop.map((pt, pIdx) => (
                    <circle
                        key={`${lIdx}-${pIdx}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={Math.max(1, 1.5 * (imageWidth / 420))}
                        className="fill-black stroke-white"
                        strokeWidth={Math.max(0.3, 0.5 * (imageWidth / 420))}
                    />
                ))
            )}
        </svg>
    );
}

export function Preview({
    viewMode,
    onViewModeChange,
    zoom,
    onZoomChange,
    onZoomReset,
    showAnchors,
    onShowAnchorsChange,
    showCheckerboard,
    onShowCheckerboardChange,
    imageSrc,
    imageWidth,
    imageHeight,
    reactPaths,
    simplifiedLoops,
    vectorLayers,
    colorMode,
    vectorColor,
    backgroundColor,
    useTransparentBg,
    isFillMode,
    strokeWidth,
    isProcessing,
    usingWorker,
    stats,
    binaryPreview,
}: PreviewProps) {
    const { t } = useI18n();
    const vectorLabel = colorMode === 'multi' ? t('preview.vectorMulti') : t('preview.vectorBw');
    const previewSurfaceRef = useRef<HTMLDivElement>(null);
    const [linkedPan, setLinkedPan] = useState<PanOffset>({ x: 0, y: 0 });

    const isSideBySide = viewMode === 'sideBySide';
    const linkedPanProps = isSideBySide ? { pan: linkedPan, onPanChange: setLinkedPan } : {};
    const sideBySideSize = useMemo(
        () => getSideBySideDisplaySize(imageWidth, imageHeight),
        [imageWidth, imageHeight],
    );
    const sideBySideFrameClass = 'rounded shadow-sm overflow-hidden border border-slate-100';

    const handleZoomReset = useCallback(() => {
        onZoomReset();
        setLinkedPan({ x: 0, y: 0 });
    }, [onZoomReset]);

    useEffect(() => {
        if (zoom <= 100) {
            setLinkedPan({ x: 0, y: 0 });
        }
    }, [zoom]);

    useEffect(() => {
        const el = previewSurfaceRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const step = e.deltaY > 0 ? -8 : 8;
            onZoomChange(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + step)));
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [zoom, onZoomChange]);

    return (
        <div className="flex flex-col bg-slate-50 p-4 space-y-4 max-h-[calc(100vh-77px)] overflow-hidden flex-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    {[
                        { id: 'sideBySide' as const, label: t('preview.tabSideBySide'), icon: Layers },
                        { id: 'vectorOnly' as const, label: t('preview.tabVector'), icon: Eye },
                        { id: 'thresholdOnly' as const, label: t('preview.tabBinary'), icon: SlidersHorizontal },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onViewModeChange(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-150 ${
                                viewMode === tab.id
                                    ? 'bg-white text-black border border-slate-200 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {useTransparentBg && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showCheckerboard}
                                onChange={(e) => onShowCheckerboardChange(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-black bg-white border-slate-300"
                            />
                            {t('preview.checkerboard')}
                        </label>
                    )}

                    {colorMode === 'bw' && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none border-l border-slate-200 pl-3">
                            <input
                                type="checkbox"
                                checked={showAnchors}
                                onChange={(e) => onShowAnchorsChange(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-black bg-white border-slate-300"
                            />
                            {t('preview.showAnchors')}
                        </label>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative flex flex-col md:flex-row">
                {isProcessing && (
                    <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur border border-neutral-200 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                        <RefreshCw className="w-3.5 h-3.5 text-black animate-spin" />
                        <span className="text-[11px] font-bold text-black">
                            {usingWorker ? t('preview.tracingWorker') : t('preview.tracing')}
                        </span>
                    </div>
                )}

                <div ref={previewSurfaceRef} className="flex-1 min-h-0 w-full relative overflow-hidden p-4 pb-20 md:p-6 md:pb-6">
                    <AnimatePresence mode="wait">
                        {viewMode === 'sideBySide' && (
                            <motion.div
                                key="sideBySide"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full"
                            >
                                <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden relative">
                                    <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                                        <span>{t('preview.originalLabel')}</span>
                                        <span className="text-[10px] bg-white border border-slate-200 text-slate-500 font-mono px-1.5 py-0.5 rounded shadow-sm">
                                            {imageWidth}x{imageHeight}px
                                        </span>
                                    </div>
                                    <div className="flex-1 min-h-[250px] relative bg-slate-50/20">
                                        {imageSrc ? (
                                            <ZoomPanViewport
                                                zoom={zoom}
                                                className="absolute inset-0"
                                                {...linkedPanProps}
                                                contentClassName={sideBySideFrameClass}
                                                contentStyle={sideBySideSize}
                                            >
                                                <img
                                                    src={imageSrc}
                                                    alt="Original drawing"
                                                    className="w-full h-full object-contain pointer-events-none"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </ZoomPanViewport>
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <FileImage className="w-12 h-12 mx-auto stroke-[1] mb-2 text-slate-300" />
                                                <p className="text-xs">{t('preview.noImage')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden relative">
                                    <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                                        <span>{vectorLabel}</span>
                                        {usingWorker && (
                                            <span className="text-[10px] bg-neutral-100 text-black font-mono px-1.5 py-0.5 rounded border border-neutral-200 font-bold uppercase">
                                                {t('preview.worker')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-h-[250px] relative bg-slate-50/20">
                                        {showCheckerboard && useTransparentBg && (
                                            <div className={CHECKERBOARD_CLASS} />
                                        )}
                                        {imageSrc && stats ? (
                                            <ZoomPanViewport
                                                zoom={zoom}
                                                className="absolute inset-0"
                                                {...linkedPanProps}
                                                contentClassName={sideBySideFrameClass}
                                                contentStyle={{
                                                    ...sideBySideSize,
                                                    backgroundColor: useTransparentBg ? 'transparent' : backgroundColor,
                                                }}
                                            >
                                                <VectorSvgContent
                                                    imageWidth={imageWidth}
                                                    imageHeight={imageHeight}
                                                    colorMode={colorMode}
                                                    reactPaths={reactPaths}
                                                    vectorLayers={vectorLayers}
                                                    vectorColor={vectorColor}
                                                    backgroundColor={backgroundColor}
                                                    useTransparentBg={useTransparentBg}
                                                    isFillMode={isFillMode}
                                                    strokeWidth={strokeWidth}
                                                    simplifiedLoops={simplifiedLoops}
                                                    showAnchors={showAnchors}
                                                />
                                            </ZoomPanViewport>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400">
                                                <Cpu className="w-12 h-12 mx-auto stroke-[1] mb-2 text-slate-300 animate-spin" />
                                                <p className="text-xs">{t('preview.loading')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {viewMode === 'vectorOnly' && (
                            <motion.div
                                key="vectorOnly"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="w-full h-full flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                            >
                                <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500">
                                    {t('preview.vectorFullView')}
                                </div>
                                <div className="flex-1 min-h-[400px] relative bg-slate-50/10">
                                    {showCheckerboard && useTransparentBg && (
                                        <div className={CHECKERBOARD_CLASS} />
                                    )}
                                    {imageSrc && stats && (
                                        <ZoomPanViewport
                                            zoom={zoom}
                                            className="absolute inset-0"
                                            contentClassName="w-full max-w-full max-h-[420px] h-[420px] rounded shadow-sm border border-slate-100"
                                            contentStyle={{ backgroundColor: useTransparentBg ? 'transparent' : backgroundColor }}
                                        >
                                            <VectorSvgContent
                                                imageWidth={imageWidth}
                                                imageHeight={imageHeight}
                                                colorMode={colorMode}
                                                reactPaths={reactPaths}
                                                vectorLayers={vectorLayers}
                                                vectorColor={vectorColor}
                                                backgroundColor={backgroundColor}
                                                useTransparentBg={useTransparentBg}
                                                isFillMode={isFillMode}
                                                strokeWidth={strokeWidth}
                                                simplifiedLoops={simplifiedLoops}
                                                showAnchors={showAnchors}
                                            />
                                        </ZoomPanViewport>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {viewMode === 'thresholdOnly' && colorMode === 'bw' && (
                            <motion.div
                                key="thresholdOnly"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                                className="w-full h-full flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                            >
                                <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500">
                                    {t('preview.binaryLabel')}
                                </div>
                                <div className="flex-1 min-h-[400px] bg-slate-50/10 relative">
                                    {binaryPreview ? (
                                        <ZoomPanViewport zoom={zoom} className="absolute inset-0 p-8">
                                            <BinaryThresholdCanvas
                                                preview={binaryPreview}
                                                className="max-w-full max-h-full object-contain rounded shadow-sm border border-slate-200"
                                            />
                                        </ZoomPanViewport>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400">
                                            <Cpu className="w-12 h-12 mx-auto stroke-[1] mb-2 text-slate-300 animate-spin" />
                                            <p className="text-xs">{t('preview.loading')}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {viewMode === 'thresholdOnly' && colorMode === 'multi' && (
                            <motion.div
                                key="thresholdOnlyMulti"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-slate-500 text-sm p-8"
                            >
                                {t('preview.binaryMultiOnly')}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <ZoomSlider zoom={zoom} onZoomChange={onZoomChange} onZoomReset={handleZoomReset} />
            </div>
        </div>
    );
}

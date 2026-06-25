import { motion, AnimatePresence } from 'motion/react';
import {
    FileImage,
    RefreshCw,
    ZoomIn,
    ZoomOut,
    SlidersHorizontal,
    Cpu,
    Eye,
    Layers,
} from 'lucide-react';
import type { ViewMode, VectorLayer, VectorStats } from '../types/vectorizer';
import type { Point } from '../utils/vectorizer';

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
                        className="fill-indigo-500 stroke-white"
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
}: PreviewProps) {
    const vectorLabel = colorMode === 'multi' ? 'BẢN VECTOR SVG ĐA MÀU' : 'BẢN VECTOR HÓA SVG MỘT MÀU';

    return (
        <div className="flex flex-col bg-slate-50 p-4 space-y-4 max-h-[calc(100vh-77px)] overflow-hidden flex-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    {[
                        { id: 'sideBySide' as const, label: 'So Sánh (Side-by-Side)', icon: Layers },
                        { id: 'vectorOnly' as const, label: 'Vector SVG Kết Quả', icon: Eye },
                        { id: 'thresholdOnly' as const, label: 'Lưới Nhị Phân (B&W)', icon: SlidersHorizontal },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onViewModeChange(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-150 ${
                                viewMode === tab.id
                                    ? 'bg-white text-indigo-600 border border-slate-200 shadow-sm'
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
                                className="w-3.5 h-3.5 rounded text-indigo-600 bg-white border-slate-300"
                            />
                            Caro nền trong suốt
                        </label>
                    )}

                    {colorMode === 'bw' && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none border-l border-slate-200 pl-3">
                            <input
                                type="checkbox"
                                checked={showAnchors}
                                onChange={(e) => onShowAnchorsChange(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-indigo-600 bg-white border-slate-300"
                            />
                            Hiển thị điểm Neo (Anchors)
                        </label>
                    )}

                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => onZoomChange(Math.max(25, zoom - 25))}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                            title="Thu nhỏ"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-mono font-medium text-slate-600 px-1 w-10 text-center">
                            {zoom}%
                        </span>
                        <button
                            onClick={() => onZoomChange(Math.min(500, zoom + 25))}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                            title="Phóng to"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onZoomReset}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 transition-colors"
                            title="Đặt lại 100%"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[300px] flex items-center justify-center">
                {isProcessing && (
                    <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur border border-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                        <span className="text-[11px] font-bold text-indigo-600">
                            {usingWorker ? 'Worker đang trích xuất nét...' : 'Đang trích xuất nét...'}
                        </span>
                    </div>
                )}

                <div className="w-full h-full flex items-center justify-center p-6 relative overflow-auto custom-scrollbar">
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
                                        <span>ẢNH GỐC / PHÁC THẢO BAN ĐẦU</span>
                                        <span className="text-[10px] bg-white border border-slate-200 text-slate-500 font-mono px-1.5 py-0.5 rounded shadow-sm">
                                            {imageWidth}x{imageHeight}px
                                        </span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center p-4 min-h-[250px] relative bg-slate-50/20">
                                        {imageSrc ? (
                                            <div
                                                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                                                className="transition-transform duration-200 max-w-full max-h-full flex items-center justify-center"
                                            >
                                                <img
                                                    src={imageSrc}
                                                    alt="Original drawing"
                                                    className="max-w-full max-h-[350px] object-contain rounded shadow-sm pointer-events-none border border-slate-100"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <FileImage className="w-12 h-12 mx-auto stroke-[1] mb-2 text-slate-300" />
                                                <p className="text-xs">Chưa tải ảnh lên</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden relative">
                                    <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                                        <span>{vectorLabel}</span>
                                        {usingWorker && (
                                            <span className="text-[10px] bg-violet-50 text-violet-600 font-mono px-1.5 py-0.5 rounded border border-violet-100 font-bold uppercase">
                                                Worker
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center p-4 min-h-[250px] relative bg-slate-50/20">
                                        {showCheckerboard && useTransparentBg && (
                                            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                                        )}
                                        {imageSrc && stats ? (
                                            <div
                                                style={{
                                                    transform: `scale(${zoom / 100})`,
                                                    transformOrigin: 'center center',
                                                    backgroundColor: useTransparentBg ? 'transparent' : backgroundColor,
                                                }}
                                                className="transition-transform duration-200 w-full max-w-full max-h-[350px] h-[350px] rounded shadow-sm overflow-hidden flex items-center justify-center relative border border-slate-100"
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
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <Cpu className="w-12 h-12 mx-auto stroke-[1] mb-2 text-slate-300 animate-spin" />
                                                <p className="text-xs">Đang nạp thuật toán...</p>
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
                                    CHẾ ĐỘ XEM TRỌN VẸN VECTOR
                                </div>
                                <div className="flex-1 flex items-center justify-center p-8 min-h-[400px] relative bg-slate-50/10">
                                    {showCheckerboard && useTransparentBg && (
                                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                                    )}
                                    {imageSrc && stats && (
                                        <div
                                            style={{
                                                transform: `scale(${zoom / 100})`,
                                                transformOrigin: 'center center',
                                                backgroundColor: useTransparentBg ? 'transparent' : backgroundColor,
                                            }}
                                            className="transition-transform duration-200 w-full max-w-full max-h-[420px] h-[420px] rounded shadow-sm flex items-center justify-center border border-slate-100"
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
                                        </div>
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
                                    ẢNH NHỊ PHÂN THỰC TẾ (1-BIT BINARY)
                                </div>
                                <div className="flex-1 flex items-center justify-center p-8 min-h-[400px] bg-slate-50/10 relative">
                                    <div
                                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                                        className="transition-transform duration-200 w-full max-w-full max-h-[420px] h-[420px] flex items-center justify-center"
                                    >
                                        <canvas
                                            id="grayscale-preview-canvas"
                                            className="max-w-full max-h-full object-contain rounded shadow-sm border border-slate-200"
                                        />
                                    </div>
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
                                Chế độ nhị phân chỉ khả dụng ở chế độ Đen Trắng.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

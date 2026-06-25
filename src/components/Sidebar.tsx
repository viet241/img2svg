import type { ChangeEvent, DragEvent, RefObject } from 'react';
import {
    Upload,
    Download,
    Copy,
    FileImage,
    Sliders,
    Check,
    SlidersHorizontal,
    Sparkles,
    Palette,
} from 'lucide-react';
import { sampleOptions } from '../samples/drawSamples';
import type { VectorSettings } from '../hooks/useVectorSettings';
import type { PaletteColor } from '../utils/quantize';
import { ControlHint } from './ControlHint';

interface SidebarProps {
    settings: VectorSettings;
    isDragging: boolean;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onDragOver: (e: DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: DragEvent) => void;
    onLoadSample: (id: number) => void;
    svgContent: string;
    copied: boolean;
    onCopySvg: () => void;
    onDownloadSvg: () => void;
    onDownloadPng: () => void;
    extractedPalette: PaletteColor[];
}

export function Sidebar({
    settings,
    isDragging,
    fileInputRef,
    onFileChange,
    onDragOver,
    onDragLeave,
    onDrop,
    onLoadSample,
    svgContent,
    copied,
    onCopySvg,
    onDownloadSvg,
    onDownloadPng,
    extractedPalette,
}: SidebarProps) {
    const {
        brightness, setBrightness,
        contrast, setContrast,
        threshold, setThreshold,
        rdpEpsilon, setRdpEpsilon,
        useBezier, setUseBezier,
        invertColors, setInvertColors,
        isFillMode, setIsFillMode,
        strokeWidth, setStrokeWidth,
        noiseFilter, setNoiseFilter,
        vectorColor, setVectorColor,
        backgroundColor, setBackgroundColor,
        useTransparentBg, setUseTransparentBg,
        colorMode, setColorMode,
        colorCount, setColorCount,
    } = settings;

    return (
        <div className="lg:col-span-4 border-r border-slate-200 bg-white p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-77px)] custom-scrollbar">
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-neutral-700" />
                    1. Tải Lên & Chọn Hình Vẽ
                </h3>

                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                        isDragging
                            ? 'border-black bg-neutral-100/50'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                    />
                    <div className="space-y-2 relative z-10">
                        <div className="mx-auto w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform duration-200">
                            <FileImage className="w-5 h-5 text-neutral-700 group-hover:text-black" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                Kéo thả hình vào đây hoặc <span className="text-black underline">chọn tệp</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                                Hỗ trợ PNG, JPG, WebP. Nên chọn ảnh vẽ tương phản cao.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-500">Hoặc thử ngay với các mẫu vẽ tay:</label>
                    <div className="grid grid-cols-3 gap-2">
                        {sampleOptions.map((sample) => (
                            <button
                                key={sample.id}
                                onClick={() => onLoadSample(sample.id)}
                                className="group relative flex flex-col justify-end p-2.5 rounded-lg border border-slate-200 hover:border-black bg-white text-left transition-all duration-200 cursor-pointer overflow-hidden h-16 shadow-sm hover:shadow"
                            >
                                <span className="text-xs font-bold text-slate-700 group-hover:text-black truncate w-full">
                                    {sample.label}
                                </span>
                                <span className="text-[9px] text-slate-500 line-clamp-1 w-full mt-0.5 leading-tight">
                                    {sample.desc}
                                </span>
                                <div className="absolute right-1 top-1 text-slate-300 group-hover:text-neutral-700 transition-colors">
                                    <Sparkles className="w-3.5 h-3.5" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-neutral-700" />
                    2. Chế Độ Màu
                </h3>

                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setColorMode('bw')}
                        className={`py-1.5 text-xs font-bold rounded transition-all ${
                            colorMode === 'bw'
                                ? 'bg-black text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Đen Trắng
                    </button>
                    <button
                        onClick={() => setColorMode('multi')}
                        className={`py-1.5 text-xs font-bold rounded transition-all ${
                            colorMode === 'multi'
                                ? 'bg-black text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Đa Màu
                    </button>
                </div>

                {colorMode === 'multi' && (
                    <>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-500">Số màu (Palette)</span>
                                <span className="font-mono text-black">{colorCount}</span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="8"
                                step="1"
                                value={colorCount}
                                onChange={(e) => setColorCount(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                        </div>
                        {extractedPalette.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                                {extractedPalette.map((c) => (
                                    <div
                                        key={c.hex}
                                        className="w-7 h-7 rounded border border-slate-200 shadow-sm"
                                        style={{ backgroundColor: c.hex }}
                                        title={c.hex}
                                    />
                                ))}
                            </div>
                        )}
                        <ControlHint>
                            Giảm số màu nếu viền răng cưa; tăng ε (Smoothing) để làm mượt từng layer.
                        </ControlHint>
                    </>
                )}
            </div>

            {colorMode === 'bw' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        3. Cân Chỉnh Độ Tương Phản & Ngưỡng
                    </h3>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">Độ Sáng (Brightness)</span>
                            <span className="font-mono text-emerald-600">{brightness > 0 ? `+${brightness}` : brightness}</span>
                        </div>
                        <input
                            type="range"
                            min="-100"
                            max="100"
                            value={brightness}
                            onChange={(e) => setBrightness(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">Độ Tương Phản (Contrast)</span>
                            <span className="font-mono text-emerald-600">{contrast > 0 ? `+${contrast}` : contrast}%</span>
                        </div>
                        <input
                            type="range"
                            min="-100"
                            max="100"
                            value={contrast}
                            onChange={(e) => setContrast(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                    </div>

                    <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-emerald-700 font-semibold">Ngưỡng Trắng Đen (Threshold)</span>
                            <span className="font-mono bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-700 text-[10px] font-bold">
                                {threshold} / 255
                            </span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="250"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>
                    <ControlHint>
                        Tăng ngưỡng để gộp nét nhạt; giảm để loại guideline và vệt bụi giấy.
                    </ControlHint>
                </div>
            )}

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
                    {colorMode === 'bw' ? '4' : '3'}. Tùy Chỉnh Nét Vẽ Vector
                </h3>

                <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">Phương Thức Trích Xuất Nét</span>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setIsFillMode(true)}
                            className={`py-1.5 text-xs font-bold rounded transition-all ${
                                isFillMode ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Tô Đặc (Solid Fill)
                        </button>
                        <button
                            onClick={() => setIsFillMode(false)}
                            className={`py-1.5 text-xs font-bold rounded transition-all ${
                                !isFillMode ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Đường Viền (Stroke)
                        </button>
                    </div>
                </div>

                {!isFillMode && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">Độ dày đường nét (Stroke Width)</span>
                            <span className="font-mono text-black">{strokeWidth}px</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="12"
                            step="0.5"
                            value={strokeWidth}
                            onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Độ Đơn Giản Hóa (Smoothing)</span>
                        <span className="font-mono text-black">ε = {rdpEpsilon.toFixed(1)}</span>
                    </div>
                    <input
                        type="range"
                        min="0.0"
                        max="4.0"
                        step="0.1"
                        value={rdpEpsilon}
                        onChange={(e) => setRdpEpsilon(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Bộ Lọc Khử Nhiễu (Noise Filter)</span>
                        <span className="font-mono text-black">&gt; {noiseFilter} điểm</span>
                    </div>
                    <input
                        type="range"
                        min="2"
                        max="12"
                        step="1"
                        value={noiseFilter}
                        onChange={(e) => setNoiseFilter(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                </div>

                <div className="pt-2 space-y-2.5 border-t border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={useBezier}
                            onChange={(e) => setUseBezier(e.target.checked)}
                            className="w-4 h-4 rounded text-black bg-white border-slate-300 focus:ring-black"
                        />
                        <span className="text-xs font-medium text-slate-600">Sử dụng đường cong Bézier trơn</span>
                    </label>

                    {colorMode === 'bw' && (
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={invertColors}
                                onChange={(e) => setInvertColors(e.target.checked)}
                                className="w-4 h-4 rounded text-black bg-white border-slate-300 focus:ring-black"
                            />
                            <span className="text-xs font-medium text-slate-600">Đảo ngược màu nhị phân (Invert)</span>
                        </label>
                    )}
                </div>
                <ControlHint>
                    ε khoảng <strong className="text-slate-600">1.0–1.5</strong>, bật Bézier và tăng khử nhiễu cho nét mượt sạch.
                </ControlHint>
            </div>

            {colorMode === 'bw' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-500" />
                        5. Cấu Hình Màu Sắc SVG
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <span className="text-xs text-slate-500">Màu nét vẽ / tô</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={vectorColor}
                                    onChange={(e) => setVectorColor(e.target.value)}
                                    className="w-8 h-8 rounded border border-slate-300 bg-transparent cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={vectorColor}
                                    onChange={(e) => setVectorColor(e.target.value)}
                                    className="w-full bg-slate-50 text-xs text-slate-700 font-mono px-2 py-1 rounded border border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-xs text-slate-500">Màu nền SVG</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    disabled={useTransparentBg}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className={`w-8 h-8 rounded border border-slate-300 bg-transparent cursor-pointer ${
                                        useTransparentBg ? 'opacity-30 cursor-not-allowed' : ''
                                    }`}
                                />
                                <input
                                    type="text"
                                    value={useTransparentBg ? 'Transparent' : backgroundColor}
                                    disabled={useTransparentBg}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className={`w-full bg-slate-50 text-xs text-slate-700 font-mono px-2 py-1 rounded border border-slate-200 ${
                                        useTransparentBg ? 'opacity-40 text-slate-400 cursor-not-allowed' : ''
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={useTransparentBg}
                            onChange={(e) => setUseTransparentBg(e.target.checked)}
                            className="w-4 h-4 rounded text-black bg-white border-slate-300 focus:ring-black"
                        />
                        <span className="text-xs font-medium text-slate-600">Thiết lập nền trong suốt (Transparent)</span>
                    </label>
                </div>
            )}

            {colorMode === 'multi' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-500" />
                        4. Nền SVG
                    </h3>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={useTransparentBg}
                            onChange={(e) => setUseTransparentBg(e.target.checked)}
                            className="w-4 h-4 rounded text-black bg-white border-slate-300 focus:ring-black"
                        />
                        <span className="text-xs font-medium text-slate-600">Nền trong suốt (Transparent)</span>
                    </label>
                    {!useTransparentBg && (
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-full bg-slate-50 text-xs font-mono px-2 py-1 rounded border border-slate-200"
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                    <button
                        onClick={onDownloadSvg}
                        disabled={!svgContent}
                        className="flex-1 bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        Tải Xuống SVG (.svg)
                    </button>
                    <button
                        onClick={onDownloadPng}
                        disabled={!svgContent}
                        className="bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-slate-200 shadow-sm"
                    >
                        Tải ảnh PNG (2x)
                    </button>
                </div>

                <button
                    onClick={onCopySvg}
                    disabled={!svgContent}
                    className="w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-pointer active:scale-[0.99] transition-all shadow-sm"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                            Đã sao chép mã SVG!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Sao chép mã nguồn SVG
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

import type { ChangeEvent, DragEvent, RefObject } from 'react';
import {
    Upload,
    Download,
    Copy,
    FileImage,
    Check,
    SlidersHorizontal,
    Sparkles,
    Palette,
} from 'lucide-react';
import { sampleOptions } from '../samples/drawSamples';
import type { VectorSettings } from '../hooks/useVectorSettings';
import type { PaletteColor } from '../utils/quantize';
import { ControlHint } from './ControlHint';
import { RichText } from './RichText';
import { useI18n } from '../i18n/context';

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

    const { t } = useI18n();

    return (
        <div className="lg:col-span-4 border-r border-slate-200 bg-white flex flex-col max-h-[calc(100vh-77px)]">
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-neutral-700" />
                    {t('sidebar.uploadTitle')}
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
                                <RichText text={t('sidebar.dropzone')} />
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                                {t('sidebar.dropzoneHint')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-500">{t('sidebar.samplesLabel')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {sampleOptions.map((sample) => (
                            <button
                                key={sample.id}
                                onClick={() => onLoadSample(sample.id)}
                                className="group relative flex flex-col justify-end p-2.5 rounded-lg border border-slate-200 hover:border-black bg-white text-left transition-all duration-200 cursor-pointer overflow-hidden h-16 shadow-sm hover:shadow"
                            >
                                <span className="text-xs font-bold text-slate-700 group-hover:text-black truncate w-full">
                                    {t(`sample.${sample.id}.label`)}
                                </span>
                                <span className="text-[9px] text-slate-500 line-clamp-1 w-full mt-0.5 leading-tight">
                                    {t(`sample.${sample.id}.desc`)}
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
                    {t('sidebar.colorModeTitle')}
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
                        {t('sidebar.bw')}
                    </button>
                    <button
                        onClick={() => setColorMode('multi')}
                        className={`py-1.5 text-xs font-bold rounded transition-all ${
                            colorMode === 'multi'
                                ? 'bg-black text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {t('sidebar.multi')}
                    </button>
                </div>

                {colorMode === 'multi' && (
                    <>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-500">{t('sidebar.paletteCount')}</span>
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
                            {t('sidebar.hintPalette')}
                        </ControlHint>
                    </>
                )}
            </div>

            {colorMode === 'bw' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                        {t('sidebar.thresholdTitle')}
                    </h3>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">{t('sidebar.brightness')}</span>
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
                            <span className="text-slate-500">{t('sidebar.contrast')}</span>
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
                            <span className="text-emerald-700 font-semibold">{t('sidebar.threshold')}</span>
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
                        {t('sidebar.hintThreshold')}
                    </ControlHint>
                </div>
            )}

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
                    {colorMode === 'bw' ? t('sidebar.vectorTitleBw') : t('sidebar.vectorTitleMulti')}
                </h3>

                <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">{t('sidebar.extractMode')}</span>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setIsFillMode(true)}
                            className={`py-1.5 text-xs font-bold rounded transition-all ${
                                isFillMode ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {t('sidebar.fill')}
                        </button>
                        <button
                            onClick={() => setIsFillMode(false)}
                            className={`py-1.5 text-xs font-bold rounded transition-all ${
                                !isFillMode ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {t('sidebar.stroke')}
                        </button>
                    </div>
                </div>

                {!isFillMode && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">{t('sidebar.strokeWidth')}</span>
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
                        <span className="text-slate-500">{t('sidebar.smoothing')}</span>
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
                        <span className="text-slate-500">{t('sidebar.noiseFilter')}</span>
                        <span className="font-mono text-black">{t('sidebar.noisePoints', { count: noiseFilter })}</span>
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
                        <span className="text-xs font-medium text-slate-600">{t('sidebar.bezier')}</span>
                    </label>

                    {colorMode === 'bw' && (
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={invertColors}
                                onChange={(e) => setInvertColors(e.target.checked)}
                                className="w-4 h-4 rounded text-black bg-white border-slate-300 focus:ring-black"
                            />
                            <span className="text-xs font-medium text-slate-600">{t('sidebar.invert')}</span>
                        </label>
                    )}
                </div>
                <ControlHint>
                    <RichText text={t('sidebar.hintSmoothing')} />
                </ControlHint>
            </div>

            {colorMode === 'bw' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-500" />
                        {t('sidebar.colorsTitle')}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <span className="text-xs text-slate-500">{t('sidebar.vectorColor')}</span>
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
                            <span className="text-xs text-slate-500">{t('sidebar.bgColor')}</span>
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
                        <span className="text-xs font-medium text-slate-600">{t('sidebar.transparent')}</span>
                    </label>
                </div>
            )}

            {colorMode === 'multi' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-500" />
                        {t('sidebar.multiBgTitle')}
                    </h3>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={useTransparentBg}
                            onChange={(e) => setUseTransparentBg(e.target.checked)}
                            className="w-4 h-4 rounded text-black bg-white border-slate-300 focus:ring-black"
                        />
                        <span className="text-xs font-medium text-slate-600">{t('sidebar.transparent')}</span>
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

            </div>

            <div className="shrink-0 sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-5 pt-4 space-y-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.2)]">
                <div className="flex gap-2">
                    <button
                        onClick={onDownloadSvg}
                        disabled={!svgContent}
                        className="flex-1 bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        {t('sidebar.downloadSvg')}
                    </button>
                    <button
                        onClick={onCopySvg}
                        disabled={!svgContent}
                        className="bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-slate-200 shadow-sm"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                                {t('sidebar.copied')}
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                {t('sidebar.copySvg')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

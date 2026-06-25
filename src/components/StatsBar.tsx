import { Info } from 'lucide-react';
import type { VectorStats } from '../types/vectorizer';

interface StatsBarProps {
    stats: VectorStats | null;
    imageWidth: number;
    imageHeight: number;
    colorMode: 'bw' | 'multi';
}

export function StatsBar({ stats, imageWidth, imageHeight, colorMode }: StatsBarProps) {
    return (
        <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-6 gap-3 text-center shadow-sm">
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ phân giải</span>
                    <span className="text-sm font-mono font-bold text-slate-700">
                        {imageWidth && imageHeight ? `${imageWidth} × ${imageHeight}` : '---'}
                    </span>
                </div>

                <div className="space-y-1 border-l border-slate-200 pl-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Phân đoạn viền</span>
                    <span className="text-sm font-mono font-bold text-slate-700">
                        {stats ? stats.rawSegmentsCount.toLocaleString() : '---'}
                    </span>
                </div>

                <div className="space-y-1 border-l border-slate-200 pl-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Đường nét khép kín</span>
                    <span className="text-sm font-mono font-bold text-emerald-600">
                        {stats ? stats.finalPathsCount.toLocaleString() : '---'}
                    </span>
                </div>

                <div className="space-y-1 border-l border-slate-200 pl-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng số điểm neo</span>
                    <span className="text-sm font-mono font-bold text-indigo-600">
                        {stats ? stats.totalPointsCount.toLocaleString() : '---'}
                    </span>
                </div>

                <div className="space-y-1 border-l border-slate-200 pl-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Đã khử nhiễu rác</span>
                    <span className="text-xs font-mono font-semibold text-pink-600">
                        {stats ? `${stats.filteredCount} vệt` : '---'}
                    </span>
                </div>

                {colorMode === 'multi' && (
                    <div className="space-y-1 border-l border-slate-200 pl-2 col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Layers / Palette</span>
                        <span className="text-sm font-mono font-bold text-violet-600">
                            {stats?.layerCount ?? '---'} / {stats?.paletteCount ?? '---'}
                        </span>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 text-slate-500 text-[11px] leading-normal flex gap-2.5 items-start shadow-sm">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Mẹo tối ưu hóa đường vẽ:</span>
                    {colorMode === 'bw' ? (
                        <>
                            Kéo <strong className="text-slate-700">ε (Smoothing)</strong> lên{' '}
                            <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono font-bold">1.0</code>
                            –
                            <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono font-bold">1.5</code>,
                            bật <strong className="text-slate-700">Bézier</strong> và tăng{' '}
                            <strong className="text-slate-700">Bộ lọc khử nhiễu</strong> cho nét sạch.
                        </>
                    ) : (
                        <>
                            Chế độ <strong className="text-slate-700">Đa màu</strong> dùng k-means palette.
                            Giảm số màu nếu viền răng cưa; tăng ε để làm mượt từng layer.
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

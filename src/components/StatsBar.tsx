import type { VectorStats } from '../types/vectorizer';

interface StatsBarProps {
    stats: VectorStats | null;
    imageWidth: number;
    imageHeight: number;
    colorMode: 'bw' | 'multi';
}

function StatItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-slate-400">{label}</span>
            <span className={`font-mono font-semibold tabular-nums ${accent ? 'text-emerald-700' : 'text-slate-700'}`}>
                {value}
            </span>
        </span>
    );
}

export function StatsBar({ stats, imageWidth, imageHeight, colorMode }: StatsBarProps) {
    const resolution = imageWidth && imageHeight ? `${imageWidth}×${imageHeight}` : '—';

    return (
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                <StatItem label="Độ phân giải" value={resolution} />
                <span className="text-slate-200 hidden sm:inline">|</span>
                <StatItem label="Phân đoạn viền" value={stats ? stats.rawSegmentsCount.toLocaleString() : '—'} />
                <span className="text-slate-200 hidden sm:inline">|</span>
                <StatItem label="Đường nét khép kín" value={stats ? stats.finalPathsCount.toLocaleString() : '—'} accent />
                <span className="text-slate-200 hidden sm:inline">|</span>
                <StatItem label="Tổng số điểm neo" value={stats ? stats.totalPointsCount.toLocaleString() : '—'} />
                <span className="text-slate-200 hidden sm:inline">|</span>
                <StatItem label="Đã khử nhiễu rác" value={stats ? `${stats.filteredCount} vệt` : '—'} />
                {colorMode === 'multi' && (
                    <>
                        <span className="text-slate-200 hidden sm:inline">|</span>
                        <StatItem
                            label="Layers / Palette"
                            value={stats ? `${stats.layerCount ?? '—'}/${stats.paletteCount ?? '—'}` : '—'}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

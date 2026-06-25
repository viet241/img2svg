import { RefreshCw } from 'lucide-react';

const ZOOM_MIN = 25;
const ZOOM_MAX = 500;

interface ZoomSliderProps {
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onZoomReset: () => void;
}

export function ZoomSlider({ zoom, onZoomChange, onZoomReset }: ZoomSliderProps) {
    return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-2 py-3 shadow-sm">
            <span className="text-[10px] font-mono font-semibold text-slate-600 tabular-nums">{zoom}%</span>
            <input
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={5}
                value={zoom}
                onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
                className="zoom-slider-vertical accent-black"
                aria-label="Zoom"
            />
            <button
                type="button"
                onClick={onZoomReset}
                className="p-1 rounded text-slate-500 hover:text-black hover:bg-slate-100 transition-colors"
                title="Đặt lại 100% và vị trí xem"
            >
                <RefreshCw className="w-3 h-3" />
            </button>
        </div>
    );
}

export { ZOOM_MIN, ZOOM_MAX };

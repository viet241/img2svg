import { RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n/context';

const ZOOM_MIN = 25;
const ZOOM_MAX = 500;

interface ZoomSliderProps {
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onZoomReset: () => void;
}

export function ZoomSlider({ zoom, onZoomChange, onZoomReset }: ZoomSliderProps) {
    const { t } = useI18n();

    return (
        <div className="absolute z-30 flex items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-sm bottom-3 left-3 right-3 px-3 py-2 md:bottom-auto md:left-auto md:right-3 md:top-1/2 md:-translate-y-1/2 md:flex-col md:px-2 md:py-3 md:w-auto">
            <span className="text-[10px] font-mono font-semibold text-slate-600 tabular-nums shrink-0 md:order-none">
                {zoom}%
            </span>
            <input
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={5}
                value={zoom}
                onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
                className="zoom-slider-responsive accent-black flex-1 min-w-0 md:flex-none"
                aria-label={t('zoom.label')}
            />
            <button
                type="button"
                onClick={onZoomReset}
                className="p-1 rounded text-slate-500 hover:text-black hover:bg-slate-100 transition-colors shrink-0"
                title={t('zoom.reset')}
            >
                <RefreshCw className="w-3 h-3" />
            </button>
        </div>
    );
}

export { ZOOM_MIN, ZOOM_MAX };

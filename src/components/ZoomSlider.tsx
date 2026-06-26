import { RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n/context';

const ZOOM_MIN = 25;
const ZOOM_MAX = 500;

interface ZoomSliderProps {
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onZoomReset: () => void;
}

function ZoomControls({
    zoom,
    onZoomChange,
    onZoomReset,
    rangeClassName,
}: ZoomSliderProps & { rangeClassName: string }) {
    const { t } = useI18n();

    return (
        <>
            <span className="text-[10px] font-mono font-semibold text-slate-600 tabular-nums shrink-0">
                {zoom}%
            </span>
            <input
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={5}
                value={zoom}
                onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
                className={rangeClassName}
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
        </>
    );
}

export function ZoomSlider({ zoom, onZoomChange, onZoomReset }: ZoomSliderProps) {
    return (
        <>
            <div className="absolute z-30 flex md:hidden items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-sm bottom-3 left-3 right-3 px-3 py-2">
                <ZoomControls
                    zoom={zoom}
                    onZoomChange={onZoomChange}
                    onZoomReset={onZoomReset}
                    rangeClassName="zoom-slider-horizontal accent-black flex-1 min-w-0"
                />
            </div>

            <div className="hidden md:flex z-30 shrink-0 self-stretch my-6 mr-5 flex-col items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-sm px-2.5 py-3 w-11">
                <ZoomControls
                    zoom={zoom}
                    onZoomChange={onZoomChange}
                    onZoomReset={onZoomReset}
                    rangeClassName="zoom-slider-vertical-full accent-black flex-1 min-h-0 w-full"
                />
            </div>
        </>
    );
}

export { ZOOM_MIN, ZOOM_MAX };

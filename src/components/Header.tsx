import { Cpu, Palette, Scissors, Compass, Sparkles } from 'lucide-react';
import { PRESETS } from '../hooks/useVectorSettings';

const PRESET_ICONS = {
    logo: Palette,
    sketch: Scissors,
    technical: Compass,
    artistic: Sparkles,
} as const;

interface HeaderProps {
    activePreset: string;
    onPresetChange: (preset: string) => void;
}

export function Header({ activePreset, onPresetChange }: HeaderProps) {
    return (
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="bg-black p-2.5 rounded-xl shadow-sm">
                    <Cpu className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-slate-950">
                            img2svg
                        </h1>
                        <span className="text-[10px] bg-neutral-100 text-black font-mono px-1.5 py-0.5 rounded border border-neutral-200 font-bold uppercase tracking-wider">
                            v1.0
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Chuyển đổi ảnh thành SVG vector
                    </p>
                </div>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-xs font-medium text-slate-500 px-2.5">Preset:</span>
                <div className="flex gap-0.5">
                    {PRESETS.map((preset) => {
                        const Icon = PRESET_ICONS[preset.id];
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => onPresetChange(preset.id)}
                                title={preset.description}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                    activePreset === preset.id
                                        ? 'bg-black text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}

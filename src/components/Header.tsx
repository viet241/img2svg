import { PRESET_IDS } from '../hooks/useVectorSettings';
import { useI18n } from '../i18n/context';
import { AppLogo } from './AppLogo';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
    activePreset: string;
    onPresetChange: (preset: string) => void;
}

export function Header({ activePreset, onPresetChange }: HeaderProps) {
    const { t } = useI18n();

    return (
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 sticky top-0 z-50">
            <div className="flex items-start justify-between gap-3 min-w-0 md:items-center md:justify-start md:shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <AppLogo />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
                                img2svg
                            </h1>
                            <span className="text-[10px] bg-neutral-100 text-black font-mono px-1.5 py-0.5 rounded border border-neutral-200 font-bold uppercase tracking-wider">
                                v1.0
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate sm:whitespace-normal">
                            {t('header.tagline')}
                        </p>
                    </div>
                </div>

                <LanguageSwitcher className="md:hidden" />
            </div>

            <div className="flex items-center gap-2 md:shrink-0 min-w-0">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto min-w-0">
                    <span className="text-xs font-medium text-slate-500 px-2 sm:px-2.5 shrink-0">{t('header.preset')}:</span>
                    <div className="flex gap-0.5 min-w-0">
                        {PRESET_IDS.map((presetId) => (
                            <button
                                key={presetId}
                                type="button"
                                onClick={() => onPresetChange(presetId)}
                                title={t(`preset.${presetId}.description`)}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
                                    activePreset === presetId
                                        ? 'bg-black text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                            >
                                {t(`preset.${presetId}.label`)}
                            </button>
                        ))}
                    </div>
                </div>

                <LanguageSwitcher className="hidden md:flex shrink-0" />
            </div>
        </header>
    );
}

import { useI18n } from '../i18n/context';
import type { Locale } from '../i18n/types';

const OPTIONS: { id: Locale; label: string }[] = [
    { id: 'en', label: 'EN' },
    { id: 'vi', label: 'VI' },
];

export function LanguageSwitcher({ className = '' }: { className?: string }) {
    const { locale, setLocale } = useI18n();

    return (
        <div
            className={`flex items-center shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200 ${className}`}
            role="group"
            aria-label="Language"
        >
            {OPTIONS.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => setLocale(option.id)}
                    className={`min-w-[2.25rem] px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                        locale === option.id
                            ? 'bg-black text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    aria-pressed={locale === option.id}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

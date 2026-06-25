import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readLocaleCookie, writeLocaleCookie } from './cookies';
import { messages } from './messages';
import type { Locale } from './types';
import { DEFAULT_LOCALE } from './types';

type MessageParams = Record<string, string | number>;

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: MessageParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolvePath(tree: unknown, key: string): string | undefined {
    const value = key.split('.').reduce<unknown>((node, part) => {
        if (node && typeof node === 'object' && part in (node as object)) {
            return (node as Record<string, unknown>)[part];
        }
        return undefined;
    }, tree);

    return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: MessageParams): string {
    if (!params) return template;
    return Object.entries(params).reduce(
        (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
        template,
    );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => readLocaleCookie() ?? DEFAULT_LOCALE);

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        writeLocaleCookie(next);
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const t = useCallback((key: string, params?: MessageParams) => {
        const value = resolvePath(messages[locale], key) ?? resolvePath(messages.en, key) ?? key;
        return interpolate(value, params);
    }, [locale]);

    const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        throw new Error('useI18n must be used within LocaleProvider');
    }
    return ctx;
}

export type Locale = 'en' | 'vi';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'img2svg_locale';

export function isLocale(value: string): value is Locale {
    return value === 'en' || value === 'vi';
}

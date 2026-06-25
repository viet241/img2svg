import type { Locale } from './types';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from './types';

export function readLocaleCookie(): Locale {
    if (typeof document === 'undefined') return DEFAULT_LOCALE;

    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
    const value = match ? decodeURIComponent(match[1]) : '';

    return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function writeLocaleCookie(locale: Locale): void {
    if (typeof document === 'undefined') return;

    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=${maxAge};SameSite=Lax`;
}

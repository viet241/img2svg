/** Bump when app icons change so browsers fetch fresh assets. */
export const ICON_VERSION = '8';

export function iconUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${normalized}?v=${ICON_VERSION}`;
}

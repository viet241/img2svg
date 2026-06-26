export const SITE_NAME = 'img2svg';

export const SITE_TITLE = 'Image to SVG Vectorizer';

export const SITE_DESCRIPTION =
    'Convert images to SVG vectors in your browser. Everything runs locally on your device — private and fast.';

function resolveSiteUrl(): string {
    const fromEnv = process.env.SITE_URL?.trim() || process.env.URL?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, '');
    }
    return 'https://img2svg.viet241.com';
}

export const SITE_URL = resolveSiteUrl();

export const OG_IMAGE_PATH = '/og.png';

export function absoluteOgImageUrl(): string {
    return `${SITE_URL}${OG_IMAGE_PATH}`;
}

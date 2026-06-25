import type { VectorLayer } from '../types/vectorizer';

export interface BwSvgOptions {
    width: number;
    height: number;
    paths: string[];
    vectorColor: string;
    backgroundColor: string;
    useTransparentBg: boolean;
    isFillMode: boolean;
    strokeWidth: number;
}

export function buildBwSvg(options: BwSvgOptions): string {
    const {
        width,
        height,
        paths,
        vectorColor,
        backgroundColor,
        useTransparentBg,
        isFillMode,
        strokeWidth,
    } = options;

    const bg = useTransparentBg ? 'transparent' : backgroundColor;
    const sWidth = isFillMode ? 0 : strokeWidth;

    const pathElements = isFillMode
        ? `<path d="${paths.join(' ')}" fill="${vectorColor}" fill-rule="evenodd" stroke="none" />`
        : paths.map((d) =>
            `<path d="${d}" fill="none" stroke="${vectorColor}" stroke-width="${sWidth}" stroke-linecap="round" stroke-linejoin="round" />`
        ).join('\n  ');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bg};">
  ${pathElements}
</svg>`;
}

export interface MultiSvgOptions {
    width: number;
    height: number;
    layers: VectorLayer[];
    backgroundColor: string;
    useTransparentBg: boolean;
    isFillMode: boolean;
    strokeWidth: number;
}

export function buildMultiColorSvg(options: MultiSvgOptions): string {
    const { width, height, layers, backgroundColor, useTransparentBg, isFillMode, strokeWidth } = options;
    const bg = useTransparentBg ? 'transparent' : backgroundColor;

    const pathElements = layers.flatMap((layer) => {
        if (layer.paths.length === 0) return [];

        if (isFillMode) {
            return [`<path d="${layer.paths.join(' ')}" fill="${layer.color}" fill-rule="evenodd" stroke="none" />`];
        }

        return layer.paths.map(
            (d) =>
                `<path d="${d}" fill="none" stroke="${layer.color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`
        );
    }).join('\n  ');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bg};">
  ${pathElements}
</svg>`;
}

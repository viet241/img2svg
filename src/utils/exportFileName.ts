function pad(value: number): string {
    return String(value).padStart(2, '0');
}

export function sanitizeFileBaseName(name: string): string {
    const trimmed = name.trim().replace(/\.[^.]+$/, '');
    const sanitized = trimmed
        .replace(/[^\w\u00C0-\u024f.-]+/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    return sanitized || 'image';
}

export function formatExportTimestamp(date = new Date()): string {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function buildExportFileName(baseName: string, suffix: string, extension: string): string {
    const safeBase = sanitizeFileBaseName(baseName);
    const safeSuffix = suffix.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
    const ext = extension.replace(/^\./, '');
    return `${safeBase}-${safeSuffix}-${formatExportTimestamp()}.${ext}`;
}

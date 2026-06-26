export const en = {
    header: {
        tagline: 'Make any sketch scalable',
        preset: 'Preset',
    },
    preset: {
        logo: { label: 'Logo', description: 'Solid fill, sharp edges — icons and flat shapes' },
        sketch: { label: 'Sketch', description: 'Thin strokes — pencil and hand-drawn lines' },
        technical: { label: 'Technical', description: 'Angular, minimal smoothing — diagrams and wireframes' },
        artistic: { label: 'Artistic', description: 'Bold strokes, heavy smoothing — posters and illustration' },
    },
    sample: {
        '1': { label: 'Mandala Flower', desc: 'Complex symmetric pattern' },
        '2': { label: 'Hand-drawn Cat', desc: 'Thin playful sketch lines' },
        '3': { label: 'Geometric Spiral', desc: 'Thin symmetric swirl' },
    },
    sidebar: {
        uploadTitle: '1. Upload & Pick Artwork',
        dropzone: 'Drop an image here or <pick>choose a file</pick>',
        dropzoneHint: 'Supports PNG, JPG, WebP. High-contrast artwork works best.',
        pageDrop: 'Drop image to upload or replace',
        pageDropHint: 'PNG, JPG, WebP, and other image formats',
        samplesLabel: 'Or try a hand-drawn sample:',
        colorModeTitle: '2. Color Mode',
        bw: 'Black & White',
        multi: 'Multi-color',
        paletteCount: 'Color count (Palette)',
        thresholdTitle: '3. Contrast & Threshold',
        brightness: 'Brightness',
        contrast: 'Contrast',
        threshold: 'B&W Threshold',
        vectorTitleBw: '4. Vector Stroke Settings',
        vectorTitleMulti: '3. Vector Stroke Settings',
        extractMode: 'Extraction mode',
        fill: 'Solid fill',
        stroke: 'Stroke outline',
        strokeWidth: 'Stroke width',
        smoothing: 'Smoothing (RDP ε)',
        noiseFilter: 'Noise filter',
        noisePoints: '>{count} pts',
        bezier: 'Smooth with quadratic Bézier curves',
        invert: 'Invert binary colors',
        colorsTitle: '5. SVG Colors',
        multiBgTitle: '4. SVG Background',
        vectorColor: 'Stroke / fill color',
        bgColor: 'SVG background',
        transparent: 'Transparent background',
        downloadSvg: 'Download SVG (.svg)',
        copySvg: 'Copy SVG source',
        copied: 'SVG copied!',
        hintPalette: 'Reduce colors if edges look jagged; increase ε (Smoothing) to soften each layer.',
        hintThreshold: 'Raise threshold to merge faint lines; lower to drop guidelines and paper noise.',
        hintSmoothing: 'Try ε around <strong>1.0–1.5</strong>, enable Bézier, and raise noise filter for clean smooth strokes.',
    },
    preview: {
        tabSideBySide: 'Compare',
        tabVector: 'Vector result',
        tabBinary: 'Binary grid (B&W)',
        checkerboard: 'Transparent checkerboard',
        showAnchors: 'Show anchor points',
        tracing: 'Tracing contours...',
        tracingWorker: 'Worker tracing contours...',
        originalLabel: 'ORIGINAL / SOURCE SKETCH',
        vectorBw: 'VECTORIZED SVG (MONO)',
        vectorMulti: 'VECTORIZED SVG (MULTI)',
        vectorFullView: 'FULL VECTOR PREVIEW',
        binaryLabel: 'BINARY PREVIEW (1-BIT)',
        binaryMultiOnly: 'Binary preview is only available in Black & White mode.',
        noImage: 'No image uploaded yet',
        loading: 'Loading pipeline...',
        worker: 'Worker',
    },
    zoom: {
        label: 'Zoom',
        reset: 'Reset to 100% and center view',
    },
    stats: {
        resolution: 'Resolution',
        segments: 'Boundary segments',
        paths: 'Closed paths',
        points: 'Anchor points',
        filtered: 'Noise removed',
        filteredValue: '{count} paths',
        layers: 'Layers / Palette',
    },
} as const satisfies Messages;

export interface Messages {
    header: {
        tagline: string;
        preset: string;
    };
    preset: Record<'logo' | 'sketch' | 'technical' | 'artistic', { label: string; description: string }>;
    sample: Record<'1' | '2' | '3', { label: string; desc: string }>;
    sidebar: {
        uploadTitle: string;
        dropzone: string;
        dropzoneHint: string;
        pageDrop: string;
        pageDropHint: string;
        samplesLabel: string;
        colorModeTitle: string;
        bw: string;
        multi: string;
        paletteCount: string;
        thresholdTitle: string;
        brightness: string;
        contrast: string;
        threshold: string;
        vectorTitleBw: string;
        vectorTitleMulti: string;
        extractMode: string;
        fill: string;
        stroke: string;
        strokeWidth: string;
        smoothing: string;
        noiseFilter: string;
        noisePoints: string;
        bezier: string;
        invert: string;
        colorsTitle: string;
        multiBgTitle: string;
        vectorColor: string;
        bgColor: string;
        transparent: string;
        downloadSvg: string;
        copySvg: string;
        copied: string;
        hintPalette: string;
        hintThreshold: string;
        hintSmoothing: string;
    };
    preview: {
        tabSideBySide: string;
        tabVector: string;
        tabBinary: string;
        checkerboard: string;
        showAnchors: string;
        tracing: string;
        tracingWorker: string;
        originalLabel: string;
        vectorBw: string;
        vectorMulti: string;
        vectorFullView: string;
        binaryLabel: string;
        binaryMultiOnly: string;
        noImage: string;
        loading: string;
        worker: string;
    };
    zoom: {
        label: string;
        reset: string;
    };
    stats: {
        resolution: string;
        segments: string;
        paths: string;
        points: string;
        filtered: string;
        filteredValue: string;
        layers: string;
    };
}

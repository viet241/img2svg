import { useState, useCallback } from 'react';
import type { ColorMode } from '../types/vectorizer';
import type { PaletteColor } from '../utils/quantize';

export const PRESETS = [
    {
        id: 'logo',
        label: 'Logo',
        description: 'Tô đặc, nét sắc — icon, logo, hình khối rõ ràng',
    },
    {
        id: 'sketch',
        label: 'Phác thảo',
        description: 'Nét mảnh, chỉ viền — bút chì, sketch vẽ tay',
    },
    {
        id: 'technical',
        label: 'Bản vẽ',
        description: 'Góc cạnh, ít làm mượt — sơ đồ, wireframe kỹ thuật',
    },
    {
        id: 'artistic',
        label: 'Minh họa',
        description: 'Nét dày, làm mượt mạnh — poster, tranh nghệ thuật',
    },
] as const;

export function useVectorSettings() {
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(20);
    const [threshold, setThreshold] = useState(128);
    const [rdpEpsilon, setRdpEpsilon] = useState(1.0);
    const [useBezier, setUseBezier] = useState(true);
    const [invertColors, setInvertColors] = useState(false);
    const [isFillMode, setIsFillMode] = useState(true);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [noiseFilter, setNoiseFilter] = useState(4);
    const [vectorColor, setVectorColor] = useState('#1a1a1a');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [useTransparentBg, setUseTransparentBg] = useState(true);
    const [activePreset, setActivePreset] = useState('logo');
    const [colorMode, setColorMode] = useState<ColorMode>('bw');
    const [colorCount, setColorCount] = useState(4);
    const [extractedPalette, setExtractedPalette] = useState<PaletteColor[]>([]);

    const applyPreset = useCallback((preset: string) => {
        setActivePreset(preset);
        switch (preset) {
            case 'logo':
                setThreshold(128);
                setBrightness(0);
                setContrast(30);
                setRdpEpsilon(1.0);
                setUseBezier(true);
                setIsFillMode(true);
                setNoiseFilter(4);
                break;
            case 'sketch':
                setThreshold(150);
                setBrightness(10);
                setContrast(15);
                setRdpEpsilon(0.6);
                setUseBezier(true);
                setIsFillMode(false);
                setStrokeWidth(2.5);
                setNoiseFilter(3);
                break;
            case 'technical':
                setThreshold(120);
                setBrightness(0);
                setContrast(40);
                setRdpEpsilon(0.3);
                setUseBezier(false);
                setIsFillMode(false);
                setStrokeWidth(1.5);
                setNoiseFilter(2);
                break;
            case 'artistic':
                setThreshold(135);
                setBrightness(-5);
                setContrast(25);
                setRdpEpsilon(1.8);
                setUseBezier(true);
                setIsFillMode(true);
                setNoiseFilter(6);
                break;
        }
    }, []);

    return {
        brightness,
        setBrightness,
        contrast,
        setContrast,
        threshold,
        setThreshold,
        rdpEpsilon,
        setRdpEpsilon,
        useBezier,
        setUseBezier,
        invertColors,
        setInvertColors,
        isFillMode,
        setIsFillMode,
        strokeWidth,
        setStrokeWidth,
        noiseFilter,
        setNoiseFilter,
        vectorColor,
        setVectorColor,
        backgroundColor,
        setBackgroundColor,
        useTransparentBg,
        setUseTransparentBg,
        activePreset,
        applyPreset,
        colorMode,
        setColorMode,
        colorCount,
        setColorCount,
        extractedPalette,
        setExtractedPalette,
    };
}

export type VectorSettings = ReturnType<typeof useVectorSettings>;

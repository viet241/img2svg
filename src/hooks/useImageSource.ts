import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { renderSampleToDataUrl } from '../samples/drawSamples';

export const MAX_IMAGE_DIM_WITH_WORKER = 1600;
export const MAX_IMAGE_DIM_FALLBACK = 900;

export function useImageSource(workerAvailable = true) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
    const [imageWidth, setImageWidth] = useState(0);
    const [imageHeight, setImageHeight] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxDim = workerAvailable ? MAX_IMAGE_DIM_WITH_WORKER : MAX_IMAGE_DIM_FALLBACK;

    const handleImageLoad = useCallback((src: string) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            let w = img.width;
            let h = img.height;

            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                } else {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);

            setOriginalImageData(imgData);
            setImageWidth(w);
            setImageHeight(h);
            setImageSrc(src);
        };
        img.src = src;
    }, [maxDim]);

    const readFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                handleImageLoad(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    }, [handleImageLoad]);

    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) readFile(file);
    }, [readFile]);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setIsDragging(false), []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
    }, [readFile]);

    const loadSample = useCallback((sampleId: number) => {
        const dataUrl = renderSampleToDataUrl(sampleId);
        if (dataUrl) handleImageLoad(dataUrl);
    }, [handleImageLoad]);

    return {
        imageSrc,
        originalImageData,
        imageWidth,
        imageHeight,
        isDragging,
        fileInputRef,
        handleImageLoad,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        loadSample,
    };
}

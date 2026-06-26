import { useState, useRef, useCallback, useEffect, type ChangeEvent, type DragEvent } from 'react';
import { renderSampleToDataUrl } from '../samples/drawSamples';
import { sanitizeFileBaseName } from '../utils/exportFileName';

export const MAX_IMAGE_DIM_WITH_WORKER = 1600;
export const MAX_IMAGE_DIM_FALLBACK = 900;

function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

function getImageFileFromTransfer(dataTransfer: DataTransfer | null): File | null {
    if (!dataTransfer?.files?.length) {
        return null;
    }

    for (const file of Array.from(dataTransfer.files)) {
        if (isImageFile(file)) {
            return file;
        }
    }

    return null;
}

function hasImageTransfer(dataTransfer: DataTransfer | null): boolean {
    if (!dataTransfer) {
        return false;
    }

    if (Array.from(dataTransfer.types).includes('Files')) {
        return true;
    }

    return Array.from(dataTransfer.items).some((item) => item.kind === 'file' && item.type.startsWith('image/'));
}

export function useImageSource(workerAvailable = true) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
    const [imageWidth, setImageWidth] = useState(0);
    const [imageHeight, setImageHeight] = useState(0);
    const [sourceBaseName, setSourceBaseName] = useState('sample-1');
    const [isDragging, setIsDragging] = useState(false);
    const [isPageDragging, setIsPageDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pageDragDepthRef = useRef(0);

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
        if (!isImageFile(file)) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setSourceBaseName(sanitizeFileBaseName(file.name));
                handleImageLoad(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    }, [handleImageLoad]);

    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            readFile(file);
        }
        e.target.value = '';
    }, [readFile]);

    const handleDragOver = useCallback((e: DragEvent) => {
        if (!hasImageTransfer(e.dataTransfer)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setIsPageDragging(false);
        pageDragDepthRef.current = 0;

        const file = getImageFileFromTransfer(e.dataTransfer);
        if (file) {
            readFile(file);
        }
    }, [readFile]);

    useEffect(() => {
        const onDragEnter = (e: globalThis.DragEvent) => {
            if (!hasImageTransfer(e.dataTransfer)) {
                return;
            }
            e.preventDefault();
            pageDragDepthRef.current += 1;
            setIsPageDragging(true);
            setIsDragging(true);
        };

        const onDragOver = (e: globalThis.DragEvent) => {
            if (!hasImageTransfer(e.dataTransfer)) {
                return;
            }
            e.preventDefault();
        };

        const onDragLeave = (e: globalThis.DragEvent) => {
            if (!hasImageTransfer(e.dataTransfer)) {
                return;
            }
            e.preventDefault();
            pageDragDepthRef.current = Math.max(0, pageDragDepthRef.current - 1);
            if (pageDragDepthRef.current === 0) {
                setIsPageDragging(false);
                setIsDragging(false);
            }
        };

        const onDrop = (e: globalThis.DragEvent) => {
            if (!hasImageTransfer(e.dataTransfer)) {
                return;
            }
            e.preventDefault();
            pageDragDepthRef.current = 0;
            setIsPageDragging(false);
            setIsDragging(false);

            const file = getImageFileFromTransfer(e.dataTransfer);
            if (file) {
                readFile(file);
            }
        };

        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', onDrop);

        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('drop', onDrop);
        };
    }, [readFile]);

    const loadSample = useCallback((sampleId: number) => {
        setSourceBaseName(`sample-${sampleId}`);
        const dataUrl = renderSampleToDataUrl(sampleId);
        if (dataUrl) handleImageLoad(dataUrl);
    }, [handleImageLoad]);

    return {
        imageSrc,
        originalImageData,
        imageWidth,
        imageHeight,
        sourceBaseName,
        isDragging,
        isPageDragging,
        fileInputRef,
        handleImageLoad,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        loadSample,
    };
}

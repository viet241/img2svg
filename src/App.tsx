/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Preview } from './components/Preview';
import { StatsBar } from './components/StatsBar';
import { GlobalDropOverlay } from './components/GlobalDropOverlay';
import { useImageSource } from './hooks/useImageSource';
import { useVectorSettings } from './hooks/useVectorSettings';
import { useVectorPipeline } from './hooks/useVectorPipeline';
import type { ViewMode } from './types/vectorizer';
import { buildExportFileName } from './utils/exportFileName';

export default function App() {
    const image = useImageSource(true);
    const settings = useVectorSettings();

    const pipeline = useVectorPipeline({
        originalImageData: image.originalImageData,
        imageWidth: image.imageWidth,
        imageHeight: image.imageHeight,
        settings,
    });

    const [viewMode, setViewMode] = useState<ViewMode>('sideBySide');
    const [zoom, setZoom] = useState(100);
    const [showAnchors, setShowAnchors] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showCheckerboard, setShowCheckerboard] = useState(true);

    useEffect(() => {
        image.loadSample(1);
    }, []);

    useEffect(() => {
        if (settings.colorMode === 'multi' && viewMode === 'thresholdOnly') {
            setViewMode('sideBySide');
        }
    }, [settings.colorMode, viewMode]);

    const handleCopySvg = useCallback(() => {
        if (!pipeline.svgContent) return;
        navigator.clipboard.writeText(pipeline.svgContent).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [pipeline.svgContent]);

    const handleDownloadSvg = useCallback(() => {
        if (!pipeline.svgContent) return;
        const blob = new Blob([pipeline.svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = buildExportFileName(image.sourceBaseName, 'vectorized', 'svg');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [pipeline.svgContent, image.sourceBaseName]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-black selection:text-white" id="vectorizer-root">
            <GlobalDropOverlay visible={image.isPageDragging} />
            <Header activePreset={settings.activePreset} onPresetChange={settings.applyPreset} />

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                <Sidebar
                    settings={settings}
                    isDragging={image.isDragging}
                    fileInputRef={image.fileInputRef}
                    onFileChange={image.handleFileChange}
                    onDragOver={image.handleDragOver}
                    onDragLeave={image.handleDragLeave}
                    onDrop={image.handleDrop}
                    onLoadSample={image.loadSample}
                    svgContent={pipeline.svgContent}
                    copied={copied}
                    onCopySvg={handleCopySvg}
                    onDownloadSvg={handleDownloadSvg}
                    extractedPalette={settings.extractedPalette}
                />

                <div className="lg:col-span-8 flex flex-col">
                    <Preview
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        zoom={zoom}
                        onZoomChange={setZoom}
                        onZoomReset={() => setZoom(100)}
                        showAnchors={showAnchors}
                        onShowAnchorsChange={setShowAnchors}
                        showCheckerboard={showCheckerboard}
                        onShowCheckerboardChange={setShowCheckerboard}
                        imageSrc={image.imageSrc}
                        imageWidth={image.imageWidth}
                        imageHeight={image.imageHeight}
                        reactPaths={pipeline.reactPaths}
                        simplifiedLoops={pipeline.simplifiedLoops}
                        vectorLayers={pipeline.vectorLayers}
                        colorMode={settings.colorMode}
                        vectorColor={settings.vectorColor}
                        backgroundColor={settings.backgroundColor}
                        useTransparentBg={settings.useTransparentBg}
                        isFillMode={settings.isFillMode}
                        strokeWidth={settings.strokeWidth}
                        isProcessing={pipeline.isProcessing}
                        usingWorker={pipeline.usingWorker}
                        stats={pipeline.stats}
                        binaryPreview={pipeline.binaryPreview}
                    />

                    <div className="px-4 pb-4 space-y-4">
                        <StatsBar
                            stats={pipeline.stats}
                            imageWidth={image.imageWidth}
                            imageHeight={image.imageHeight}
                            colorMode={settings.colorMode}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

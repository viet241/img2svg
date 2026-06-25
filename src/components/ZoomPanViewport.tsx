import { useState, useEffect, useRef, type ReactNode, type CSSProperties, type PointerEvent } from 'react';

export interface PanOffset {
    x: number;
    y: number;
}

interface ZoomPanViewportProps {
    zoom: number;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    contentStyle?: CSSProperties;
    pan?: PanOffset;
    onPanChange?: (pan: PanOffset) => void;
}

export function ZoomPanViewport({
    zoom,
    children,
    className = '',
    contentClassName = '',
    contentStyle,
    pan: controlledPan,
    onPanChange,
}: ZoomPanViewportProps) {
    const [internalPan, setInternalPan] = useState<PanOffset>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

    const isControlled = controlledPan !== undefined && onPanChange !== undefined;
    const pan = isControlled ? controlledPan : internalPan;
    const setPan = isControlled ? onPanChange : setInternalPan;
    const canPan = zoom > 100;

    useEffect(() => {
        if (zoom <= 100) {
            setPan({ x: 0, y: 0 });
        }
    }, [zoom, setPan]);

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (!canPan || e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        setIsPanning(true);
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!dragStart.current) return;
        setPan({
            x: dragStart.current.panX + e.clientX - dragStart.current.x,
            y: dragStart.current.panY + e.clientY - dragStart.current.y,
        });
    };

    const endPan = (e: PointerEvent<HTMLDivElement>) => {
        if (!dragStart.current) return;
        dragStart.current = null;
        setIsPanning(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div
            className={`overflow-hidden touch-none select-none flex items-center justify-center ${canPan ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''} ${className}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
        >
            <div
                className={`shrink-0 ${contentClassName}`}
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.2s ease',
                    ...contentStyle,
                }}
            >
                {children}
            </div>
        </div>
    );
}

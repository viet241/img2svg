export interface SampleOption {
    id: number;
    draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

function drawSample1(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = width / 2;
    const cy = height / 2;

    const petals = 12;
    for (let i = 0; i < petals; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i * 2 * Math.PI) / petals);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-35, -70, -25, -160, 0, -190);
        ctx.bezierCurveTo(25, -160, 35, -70, 0, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.quadraticCurveTo(-15, -90, 0, -130);
        ctx.quadraticCurveTo(15, -90, 0, -30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -160);
        ctx.stroke();

        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, 2 * Math.PI);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, 2 * Math.PI);
    ctx.stroke();

    for (let i = 0; i < 24; i++) {
        const angle = (i * 2 * Math.PI) / 24;
        const px = cx + Math.cos(angle) * 85;
        const py = cy + Math.sin(angle) * 85;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#000000';
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 215, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawSample2(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = width / 2;
    const cy = height / 2 + 20;

    ctx.beginPath();
    ctx.moveTo(cx - 110, cy + 30);
    ctx.bezierCurveTo(cx - 130, cy - 30, cx - 120, cy - 90, cx - 110, cy - 110);
    ctx.lineTo(cx - 60, cy - 170);
    ctx.lineTo(cx - 35, cy - 110);
    ctx.bezierCurveTo(cx - 10, cy - 120, cx + 10, cy - 120, cx + 35, cy - 110);
    ctx.lineTo(cx + 60, cy - 170);
    ctx.lineTo(cx + 110, cy - 110);
    ctx.bezierCurveTo(cx + 120, cy - 90, cx + 130, cy - 30, cx + 110, cy + 30);
    ctx.bezierCurveTo(cx + 90, cy + 90, cx - 90, cy + 90, cx - 110, cy + 30);
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx - 45, cy - 25, 14, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 45, cy - 25, 14, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 49, cy - 29, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 41, cy - 21, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 41, cy - 29, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 49, cy - 21, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 10, cy - 10);
    ctx.lineTo(cx + 10, cy - 10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx - 15, cy + 18, cx - 32, cy + 8);
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + 15, cy + 18, cx + 32, cy + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 85, cy + 5);
    ctx.lineTo(cx - 150, cy);
    ctx.moveTo(cx - 85, cy + 15);
    ctx.lineTo(cx - 155, cy + 20);
    ctx.moveTo(cx - 85, cy + 25);
    ctx.lineTo(cx - 145, cy + 40);
    ctx.moveTo(cx + 85, cy + 5);
    ctx.lineTo(cx + 150, cy);
    ctx.moveTo(cx + 85, cy + 15);
    ctx.lineTo(cx + 155, cy + 20);
    ctx.moveTo(cx + 85, cy + 25);
    ctx.lineTo(cx + 145, cy + 40);
    ctx.stroke();

    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 80 + i * 5, cy + 15 - i * 3);
        ctx.lineTo(cx - 75 + i * 5, cy + 28 - i * 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 60 + i * 5, cy + 15 - i * 3);
        ctx.lineTo(cx + 65 + i * 5, cy + 28 - i * 3);
        ctx.stroke();
    }
}

function drawSample3(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = width / 2;
    const cy = height / 2;

    ctx.beginPath();
    const turns = 6;
    const maxRadius = Math.min(width, height) * 0.45;
    const steps = 400;

    for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * turns * 2 * Math.PI;
        const r = (i / steps) * maxRadius;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 3;
    for (let j = 0; j < 5; j++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(j * (Math.PI / 10));
        ctx.strokeRect(-120, -120, 240, 240);
        ctx.restore();
    }
}

export const sampleOptions: SampleOption[] = [
    { id: 1, draw: drawSample1 },
    { id: 2, draw: drawSample2 },
    { id: 3, draw: drawSample3 },
];

export function renderSampleToDataUrl(sampleId: number, size = 600): string | null {
    const sample = sampleOptions.find((s) => s.id === sampleId);
    if (!sample) return null;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    sample.draw(ctx, size, size);
    return canvas.toDataURL();
}

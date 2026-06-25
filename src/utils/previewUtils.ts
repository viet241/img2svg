export function updateGrayscaleCanvas(
    grayscale: Uint8Array,
    width: number,
    height: number,
    threshold: number,
    invertColors: boolean,
): void {
    const canvas = document.getElementById('grayscale-preview-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let i = 0; i < grayscale.length; i++) {
        const val = grayscale[i];
        const isBlack = invertColors ? val >= threshold : val < threshold;
        const color = isBlack ? 0 : 255;

        data[i * 4] = color;
        data[i * 4 + 1] = color;
        data[i * 4 + 2] = color;
        data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
}

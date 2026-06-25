import {
    rdpSimplify,
    buildPathString,
    isClosedLoop,
    isGiantSimplex,
    isImageFrameLoop,
    isDangerousOpenFill,
    type Point,
} from './vectorizer';

export interface LoopPipelineOptions {
    noiseFilter: number;
    rdpEpsilon: number;
    useBezier: boolean;
    isFillMode: boolean;
    imageWidth: number;
    imageHeight: number;
}

export interface LoopPipelineResult {
    finalLoops: Point[][];
    paths: string[];
    totalPoints: number;
    filteredCount: number;
}

export function processLoops(
    loops: Point[][],
    options: LoopPipelineOptions,
): LoopPipelineResult {
    const finalLoops: Point[][] = [];
    const paths: string[] = [];
    let totalPoints = 0;
    let filteredCount = 0;

    for (const loop of loops) {
        if (loop.length < options.noiseFilter) {
            filteredCount++;
            continue;
        }

        const simplified = rdpSimplify(loop, options.rdpEpsilon);
        if (simplified.length < 2) {
            filteredCount++;
            continue;
        }

        const closed = isClosedLoop(simplified);

        if (options.isFillMode) {
            if (isDangerousOpenFill(simplified, options.imageWidth, options.imageHeight)) {
                filteredCount++;
                continue;
            }

            if (closed && isGiantSimplex(simplified, options.imageWidth, options.imageHeight)) {
                filteredCount++;
                continue;
            }

            if (closed && isImageFrameLoop(simplified, options.imageWidth, options.imageHeight)) {
                filteredCount++;
                continue;
            }
        }

        finalLoops.push(simplified);
        totalPoints += simplified.length;

        const dStr = buildPathString(simplified, options.useBezier, { closed });
        if (dStr) paths.push(dStr);
    }

    return { finalLoops, paths, totalPoints, filteredCount };
}

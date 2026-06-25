# img2svg Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp img2svg từ monolith B&W client-side thành codebase có test, UI tách module, xử lý nặng trên Worker, và trace đa màu.

**Architecture:** Giữ pipeline hiện tại (`preprocess → trace → link → rdp → svg`) làm lõi. Bọc bằng hook `useVectorPipeline`, tách UI thành 3 khối props-driven, offload `traceContours` + `linkSegments` sang Worker với transferable buffer, mở rộng multi-color bằng quantization → mask từng màu → trace song song → merge SVG layers.

**Tech Stack:** React 19, TypeScript, Vite 6, Vitest, Web Workers (Vite `?worker`), pnpm

**Trạng thái hiện tại (chưa có gì trong 4 hạng mục này):**

| Hạng mục | Hiện tại |
|----------|----------|
| Components | Toàn bộ UI trong `src/App.tsx` (~1189 dòng) |
| Web Worker | Pipeline chạy sync trên main thread trong `useEffect` |
| Multi-color | Chỉ B&W sau `threshold`, một `vectorColor` |
| Unit test | Không có test runner, không có file test |

**Thứ tự khuyến nghị:** Phase 1 → 2 → 3 → 4 (test trước refactor, refactor trước Worker, Worker trước multi-color).

---

## Cấu trúc file sau khi hoàn thành

```
src/
├── App.tsx                      # Shell: layout + hook wiring (~80 dòng)
├── main.tsx
├── index.css
├── types/
│   └── vectorizer.ts            # Shared types: Point, Segment, Stats, VectorLayer
├── hooks/
│   ├── useImageSource.ts        # upload, drag-drop, sample, resize
│   ├── useVectorSettings.ts     # sliders, presets, color mode
│   └── useVectorPipeline.ts     # debounce, worker/main fallback, SVG build
├── components/
│   ├── Header.tsx               # title + preset tabs
│   ├── Sidebar.tsx              # upload + controls + export
│   ├── Preview.tsx              # view modes, zoom, SVG/canvas render
│   └── StatsBar.tsx             # stats grid + tips
├── workers/
│   └── trace.worker.ts          # traceContours + linkSegments
├── utils/
│   ├── vectorizer.ts            # pure functions (giữ nguyên API)
│   ├── quantize.ts              # NEW: palette extraction
│   └── svgBuilder.ts            # NEW: build SVG string từ layers
├── samples/
│   └── drawSamples.ts
tests/
└── vectorizer.test.ts           # vitest
```

---

## Phase 1 — Unit test cho `vectorizer.ts`

**Mục tiêu:** Safety net trước khi refactor App + Worker. Không đổi behavior production.

**Phụ thuộc thêm:**

```json
// package.json devDependencies
"vitest": "^3.x"
```

```json
// package.json scripts
"test": "vitest run",
"test:watch": "vitest"
```

```ts
// vite.config.ts — thêm
test: {
  environment: 'node',
},
```

### Task 1.1: Setup Vitest

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `tests/vectorizer.test.ts`

- [ ] **Step 1:** `pnpm add -D vitest`
- [ ] **Step 2:** Thêm script `test` / `test:watch`
- [ ] **Step 3:** Cấu hình `test.environment: 'node'` trong `vite.config.ts`
- [ ] **Step 4:** Commit `chore: add vitest`

### Task 1.2: Test `preprocessImage`

**Files:**
- Create: `tests/vectorizer.test.ts`
- Test: `tests/vectorizer.test.ts`

- [ ] **Step 1: Viết test**

```ts
import { describe, it, expect } from 'vitest';
import { preprocessImage } from '../src/utils/vectorizer';

function solidImageData(w: number, h: number, r: number, g: number, b: number): ImageData {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
    }
    return new ImageData(data, w, h);
}

describe('preprocessImage', () => {
    it('converts white to 255 gray with default contrast', () => {
        const { grayscale } = preprocessImage(solidImageData(2, 2, 255, 255, 255), 0, 20);
        expect(grayscale.every((v) => v === 255)).toBe(true);
    });

    it('converts black to 0 gray', () => {
        const { grayscale } = preprocessImage(solidImageData(2, 2, 0, 0, 0), 0, 20);
        expect(grayscale.every((v) => v === 0)).toBe(true);
    });

    it('applies brightness offset', () => {
        const { grayscale } = preprocessImage(solidImageData(1, 1, 100, 100, 100), 50, 0);
        expect(grayscale[0]).toBeGreaterThan(100);
    });
});
```

- [ ] **Step 2:** `pnpm test` → PASS
- [ ] **Step 3:** Commit `test: preprocessImage`

### Task 1.3: Test `traceContours` — hình vuông đen 2×2

- [ ] **Step 1: Viết test**

```ts
import { traceContours } from '../src/utils/vectorizer';

describe('traceContours', () => {
    it('traces a 2x2 black square on white background', () => {
        // 4x4 grid, center 2x2 black
        const w = 4, h = 4;
        const gray = new Uint8Array(w * h).fill(255);
        gray[5] = gray[6] = gray[9] = gray[10] = 0;

        const segments = traceContours(gray, w, h, 128, false);
        expect(segments.length).toBeGreaterThan(0);
    });

    it('returns empty when image is uniform', () => {
        const gray = new Uint8Array(4).fill(255);
        expect(traceContours(gray, 2, 2, 128, false)).toHaveLength(0);
    });

    it('respects invert flag', () => {
        const gray = new Uint8Array(4).fill(255);
        const normal = traceContours(gray, 2, 2, 128, false);
        const inverted = traceContours(gray, 2, 2, 128, true);
        expect(normal).toHaveLength(0);
        expect(inverted.length).toBeGreaterThan(0);
    });
});
```

- [ ] **Step 2:** `pnpm test` → PASS
- [ ] **Step 3:** Commit `test: traceContours`

### Task 1.4: Test `linkSegments`, `rdpSimplify`, `buildPathString`

- [ ] **Step 1:** Test `linkSegments` nối 2 segment tạo thành 1 polyline 3 điểm
- [ ] **Step 2:** Test `rdpSimplify` với đường thẳng 10 điểm, ε lớn → còn 2 điểm
- [ ] **Step 3:** Test `buildPathString` polygon mode bắt đầu bằng `M`, bezier mode chứa `Q`
- [ ] **Step 4:** Test `buildPathString` đóng loop (`Z`) khi đầu/cuối gần nhau
- [ ] **Step 5:** Commit `test: link, rdp, buildPathString`

**Tiêu chí hoàn thành Phase 1:** `pnpm test` pass, ≥15 test cases, CI-ready.

---

## Phase 2 — Tách `App.tsx` thành components

**Mục tiêu:** Refactor thuần — không đổi UI/behavior. `pnpm lint && pnpm build && pnpm test` pass sau mỗi task.

**Nguyên tắc:** Lift state lên `App.tsx` hoặc hooks; components chỉ nhận props + callbacks.

### Task 2.1: Tách types + `useImageSource`

**Files:**
- Create: `src/types/vectorizer.ts`
- Create: `src/hooks/useImageSource.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1:** Move `Stats` type và các type dùng chung vào `src/types/vectorizer.ts`
- [ ] **Step 2:** Extract logic: `handleImageLoad`, `readFile`, drag-drop, `loadSample`, state `imageSrc/originalImageData/width/height`
- [ ] **Step 3:** `App.tsx` gọi `useImageSource()` thay vì inline
- [ ] **Step 4:** Manual smoke test upload + sample
- [ ] **Step 5:** Commit `refactor: extract useImageSource`

### Task 2.2: Tách `useVectorSettings`

**Files:**
- Create: `src/hooks/useVectorSettings.ts`

- [ ] **Step 1:** Gom state: brightness, contrast, threshold, rdpEpsilon, useBezier, invertColors, isFillMode, strokeWidth, noiseFilter, vectorColor, backgroundColor, useTransparentBg, activePreset
- [ ] **Step 2:** Move `applyPreset()` vào hook
- [ ] **Step 3:** Export preset list constant `PRESETS`
- [ ] **Step 4:** Commit `refactor: extract useVectorSettings`

### Task 2.3: Tách `useVectorPipeline`

**Files:**
- Create: `src/hooks/useVectorPipeline.ts`
- Create: `src/utils/svgBuilder.ts` (tách logic build SVG từ `useEffect` hiện tại)

- [ ] **Step 1:** Move `useEffect` pipeline (debounce 80ms) vào hook
- [ ] **Step 2:** Extract `buildSvgContent(paths, options)` → `svgBuilder.ts`
- [ ] **Step 3:** Extract `updateGrayscaleCanvas` → helper trong hook hoặc `previewUtils.ts`
- [ ] **Step 4:** Hook return: `{ svgContent, simplifiedLoops, reactPaths, stats, isProcessing }`
- [ ] **Step 5:** Commit `refactor: extract useVectorPipeline`

### Task 2.4: Component `Header`

**Files:**
- Create: `src/components/Header.tsx`

Props:
```ts
interface HeaderProps {
    activePreset: string;
    onPresetChange: (preset: string) => void;
}
```

- [ ] **Step 1:** Cut JSX header bar (dòng ~639–684) sang `Header.tsx`
- [ ] **Step 2:** Wire props từ `App.tsx`
- [ ] **Step 3:** Commit `refactor: extract Header`

### Task 2.5: Component `Sidebar`

**Files:**
- Create: `src/components/Sidebar.tsx`

Props gồm: image upload handlers, `useVectorSettings` values + setters, export handlers (`onDownloadSvg`, `onDownloadPng`, `onCopySvg`), `copied`, `sampleOptions`, `onLoadSample`.

- [ ] **Step 1:** Cut sidebar JSX (dòng ~689–1046)
- [ ] **Step 2:** Tách sub-section nếu cần: `UploadSection`, `PreprocessControls`, `TraceControls`, `ColorControls`, `ExportActions` (optional, chỉ khi Sidebar vẫn >400 dòng)
- [ ] **Step 3:** Commit `refactor: extract Sidebar`

### Task 2.6: Component `Preview`

**Files:**
- Create: `src/components/Preview.tsx`

Props: `viewMode`, `zoom`, `imageSrc`, `imageWidth/Height`, `reactPaths`, `simplifiedLoops`, `showAnchors`, `showCheckerboard`, `useTransparentBg`, `backgroundColor`, `vectorColor`, `isFillMode`, `strokeWidth`, `isProcessing`, `stats`, callbacks zoom/view.

- [ ] **Step 1:** Cut preview workspace (dòng ~1049–1366)
- [ ] **Step 2:** Giữ `AnimatePresence` + `motion` trong Preview
- [ ] **Step 3:** Commit `refactor: extract Preview`

### Task 2.7: Component `StatsBar`

**Files:**
- Create: `src/components/StatsBar.tsx`

- [ ] **Step 1:** Cut stats grid + tips (dòng ~1369–1415)
- [ ] **Step 2:** Props: `stats`, `imageWidth`, `imageHeight`
- [ ] **Step 3:** `App.tsx` còn ~80 dòng: layout grid + hook wiring
- [ ] **Step 4:** Commit `refactor: extract StatsBar, slim App`

**Tiêu chí hoàn thành Phase 2:** `App.tsx` < 120 dòng, không regression UI, tất cả test pass.

---

## Phase 3 — Web Worker cho trace nặng

**Mục tiêu:** `traceContours` + `linkSegments` không block UI trên ảnh lớn. Cho phép tăng `maxDim` từ 900 → 1600 khi Worker available.

### Task 3.1: Worker file

**Files:**
- Create: `src/workers/trace.worker.ts`

```ts
import { traceContours, linkSegments } from '../utils/vectorizer';

export interface TraceRequest {
    id: number;
    grayscale: Uint8Array;
    width: number;
    height: number;
    threshold: number;
    invert: boolean;
}

export interface TraceResponse {
    id: number;
    segments: ReturnType<typeof traceContours>;
    loops: ReturnType<typeof linkSegments>;
}

self.onmessage = (e: MessageEvent<TraceRequest>) => {
    const { id, grayscale, width, height, threshold, invert } = e.data;
    const segments = traceContours(grayscale, width, height, threshold, invert);
    const loops = linkSegments(segments);
    const response: TraceResponse = { id, segments, loops };
    // segments/loops chứa plain objects — structured clone OK
    self.postMessage(response);
};
```

- [ ] **Step 1:** Tạo worker file
- [ ] **Step 2:** Import trong hook: `import TraceWorker from '../workers/trace.worker?worker'`
- [ ] **Step 3:** Commit `feat: trace worker scaffold`

### Task 3.2: Tích hợp vào `useVectorPipeline`

**Files:**
- Modify: `src/hooks/useVectorPipeline.ts`

Logic:
1. Main thread: `preprocessImage` (cần ImageData)
2. Post `grayscale.buffer` với transfer list `[grayscale.buffer]`
3. Nhận `loops` → main thread chạy `rdpSimplify` + `buildPathString` (nhanh, cần reactive khi slider đổi)
4. **Request ID:** mỗi lần params đổi tăng `requestId`; ignore response cũ nếu `response.id !== latestId`
5. **Fallback:** nếu `typeof Worker === 'undefined'` hoặc worker error → sync path hiện tại

- [ ] **Step 1:** Refactor pipeline: tách `runTrace(grayscale)` async
- [ ] **Step 2:** Worker pool singleton (1 worker, reuse)
- [ ] **Step 3:** `isProcessing` true từ lúc gửi đến khi nhận loops + rdp xong
- [ ] **Step 4:** Commit `feat: integrate trace worker`

### Task 3.3: Tăng giới hạn ảnh + progress UI

**Files:**
- Modify: `src/hooks/useImageSource.ts` — `maxDim` 1600 khi worker enabled
- Modify: `src/components/Preview.tsx` — spinner đã có, thêm label "Worker" khi async

- [ ] **Step 1:** Config `MAX_IMAGE_DIM = 1600` / `900` fallback
- [ ] **Step 2:** Test thủ công ảnh 1500px — UI không freeze
- [ ] **Step 3:** Commit `feat: larger images via worker`

### Task 3.4: Test Worker message contract

**Files:**
- Create: `tests/trace.worker.test.ts` (optional — test pure path qua import trực tiếp vectorizer, worker test manual)

- [ ] **Step 1:** Document trong ARCHITECTURE.md phần Worker
- [ ] **Step 2:** Commit `docs: worker architecture`

**Tiêu chí hoàn thành Phase 3:** ảnh 1200×1200 trace mượt, không jank khi kéo slider sau khi trace xong, cancel stale requests.

---

## Phase 4 — Multi-color (quantization + layer trace)

**Mục tiêu:** Hỗ trợ ảnh màu — extract palette → mask từng màu → trace → SVG nhiều `<path fill="...">`.

**Phạm vi MVP (YAGNI):**
- 2–8 màu (slider `colorCount`)
- Thuật toán: **Median Cut** hoặc **k-means đơn giản trên RGB** (không cần library nặng)
- Mỗi layer: tạo binary mask "pixel thuộc cluster này" → `traceContours` với threshold cố định
- UI toggle: `colorMode: 'bw' | 'multi'`
- Export SVG: nhiều path, mỗi path một `fill`

**Không làm trong MVP:** gradient, texture, anti-aliased color edges phức tạp, chỉnh sửa palette thủ công từng màu (phase 4.1 sau).

### Task 4.1: `quantize.ts`

**Files:**
- Create: `src/utils/quantize.ts`
- Create: `tests/quantize.test.ts`

```ts
export interface PaletteColor {
    r: number;
    g: number;
    b: number;
    hex: string;
}

export interface QuantizeResult {
    palette: PaletteColor[];
    /** index cluster per pixel, length = width * height */
    indices: Uint8Array;
}

export function quantizeImage(
    imageData: ImageData,
    colorCount: number,
): QuantizeResult;
```

- [ ] **Step 1:** Implement median cut (hoặc k-means 10 iter) trên RGB pixels
- [ ] **Step 2:** Test: ảnh 2 màu đỏ/trắng → palette 2 màu
- [ ] **Step 3:** Test: `colorCount` clamp 2–8
- [ ] **Step 4:** Commit `feat: color quantization`

### Task 4.2: Mask per layer + trace

**Files:**
- Create: `src/utils/layerTrace.ts`

```ts
import { traceContours, linkSegments, rdpSimplify, buildPathString } from './vectorizer';
import type { QuantizeResult } from './quantize';

export interface VectorLayer {
    color: string;       // hex
    paths: string[];     // SVG d strings
    pointCount: number;
}

export function traceColorLayers(
    quantize: QuantizeResult,
    width: number,
    height: number,
    options: { rdpEpsilon: number; useBezier: boolean; noiseFilter: number },
): VectorLayer[];
```

Logic mỗi cluster `c`:
1. `mask[i] = indices[i] === c ? 0 : 255` (đen = vùng cần trace)
2. `traceContours(mask, w, h, 128, false)` — không invert
3. `linkSegments` → RDP → `buildPathString`
4. Bỏ layer rỗng

- [ ] **Step 1:** Implement `traceColorLayers`
- [ ] **Step 2:** Unit test 4×4 ảnh 2 màu → 2 layers
- [ ] **Step 3:** Commit `feat: per-layer trace`

### Task 4.3: Worker cho multi-layer (optional trong Phase 4)

- [ ] **Step 1:** Mở rộng `trace.worker.ts` nhận `mode: 'bw' | 'multi'`
- [ ] **Step 2:** Multi mode: quantize trên main (cần ImageData), gửi `indices` buffer + trace từng layer trong worker loop
- [ ] **Step 3:** Commit `feat: worker multi-layer trace`

### Task 4.4: UI — color mode toggle

**Files:**
- Modify: `src/hooks/useVectorSettings.ts` — thêm `colorMode`, `colorCount`
- Modify: `src/components/Sidebar.tsx` — section "Chế độ màu"
- Modify: `src/utils/svgBuilder.ts` — `buildMultiColorSvg(layers, options)`

Sidebar thêm:
- Radio: Đen trắng / Đa màu
- Slider: Số màu (2–8), chỉ hiện khi đa màu
- Palette preview: 8 ô màu extracted

- [ ] **Step 1:** Settings state + preset compatibility (B&W presets giữ nguyên)
- [ ] **Step 2:** `useVectorPipeline` branch theo `colorMode`
- [ ] **Step 3:** Commit `feat: multi-color UI`

### Task 4.5: Preview multi-layer

**Files:**
- Modify: `src/components/Preview.tsx`

- [ ] **Step 1:** Render nhiều `<path fill={layer.color}>` thay vì một path
- [ ] **Step 2:** StatsBar thêm: số layer, số màu palette
- [ ] **Step 3:** Export SVG/PNG dùng multi-layer output
- [ ] **Step 4:** Commit `feat: multi-color preview and export`

### Task 4.6: Docs + ARCHITECTURE update

- [ ] **Step 1:** Cập nhật `docs/ARCHITECTURE.md` — multi-color pipeline, Worker, component map
- [ ] **Step 2:** Cập nhật README screenshot / usage tips
- [ ] **Step 3:** Commit `docs: multi-color architecture`

**Tiêu chí hoàn thành Phase 4:** Upload ảnh logo 4 màu → SVG 4 path đúng màu, export mở được trong Illustrator/Figma.

---

## Rủi ro & mitigations

| Rủi ro | Mitigation |
|--------|------------|
| Refactor App gây regression | Phase 1 test trước; smoke test sau mỗi component extract |
| Worker structured clone lớn | Transfer `grayscale.buffer`; không gửi ImageData |
| Stale worker response | `requestId` monotonic |
| Multi-color viền răng cưa giữa 2 màu | MVP chấp nhận; phase sau: morphological expand/shrink mask 1px |
| Quantize chậm trên ảnh lớn | Quantize trước khi resize; hoặc downsample 400px cho palette rồi map full res |

---

## Timeline ước lượng

| Phase | Effort | Có thể ship độc lập |
|-------|--------|---------------------|
| 1 — Tests | 0.5–1 ngày | ✅ |
| 2 — Components | 1–1.5 ngày | ✅ |
| 3 — Worker | 1 ngày | ✅ (cải thiện perf ngay) |
| 4 — Multi-color | 2–3 ngày | ✅ (feature lớn nhất) |

**Tổng:** ~5–7 ngày làm việc (1 dev), hoặc 2–3 ngày nếu song song Phase 1+2.

---

## Checklist trước khi merge từng phase

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Smoke: load sample → đổi slider → export SVG
- [ ] Không trailing spaces, tab 4 spaces

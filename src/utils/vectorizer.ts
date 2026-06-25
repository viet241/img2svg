/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
}

export type Segment = [Point, Point];

/**
 * Điều chỉnh độ sáng, độ tương phản và chuyển đổi ảnh thành dạng xám (grayscale)
 */
export function preprocessImage(
  imageData: ImageData,
  brightness: number, // -100 đến 100
  contrast: number,   // -100 đến 100
): { grayscale: Uint8Array; width: number; height: number } {
  const { data, width, height } = imageData;
  const grayscale = new Uint8Array(width * height);

  // Tính toán hệ số tương phản
  // contrast tương đương phạm vi từ -128 đến 128 hoặc hệ số nhân
  const factor = (259 * (contrast + 100)) / (100 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Chuyển sang ảnh xám chuẩn ITU-R BT.601
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Áp dụng độ sáng
    gray += brightness;

    // Áp dụng độ tương phản
    gray = factor * (gray - 128) + 128;

    // Giới hạn trong khoảng 0-255
    grayscale[i / 4] = Math.max(0, Math.min(255, gray));
  }

  return { grayscale, width, height };
}

/**
 * Chạy thuật toán Marching Squares để trích xuất các phân đoạn đường biên (boundary segments)
 * có hỗ trợ Nội suy tuyến tính (Linear Interpolation) để đường viền mượt mà không bị răng cưa pixel.
 */
export function traceContours(
  grayscale: Uint8Array,
  width: number,
  height: number,
  threshold: number,
  invert: boolean,
): Segment[] {
  const segments: Segment[] = [];

  const getVal = (x: number, y: number): number => {
    if (x < 0 || x >= width || y < 0 || y >= height) return invert ? 0 : 255;
    return grayscale[y * width + x];
  };

  // Xác định xem một giá trị pixel có được coi là "tối" (màu đen cần vẽ) hay không
  const isBlack = (val: number): boolean => {
    return invert ? val >= threshold : val < threshold;
  };

  // Chạy qua từng ô 2x2 trong lưới
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      // 4 góc của ô 2x2
      const v0 = getVal(x, y);         // Top-Left
      const v1 = getVal(x + 1, y);     // Top-Right
      const v2 = getVal(x + 1, y + 1); // Bottom-Right
      const v3 = getVal(x, y + 1);     // Bottom-Left

      // Mã trạng thái nhị phân (0-15)
      let state = 0;
      if (isBlack(v0)) state |= 8;
      if (isBlack(v1)) state |= 4;
      if (isBlack(v2)) state |= 2;
      if (isBlack(v3)) state |= 1;

      if (state === 0 || state === 15) continue;

      // Hàm nội suy vị trí điểm giao trên cạnh nối giữa 2 giá trị vA và vB
      const interpolate = (vA: number, vB: number): number => {
        if (Math.abs(vA - vB) < 1) return 0.5;
        const t = (threshold - vA) / (vB - vA);
        return Math.max(0, Math.min(1, t));
      };

      // Tọa độ các điểm giao trên 4 cạnh (nếu có)
      // Cạnh trên (nối v0 và v1)
      const tTop = interpolate(v0, v1);
      const pTop: Point = { x: x + tTop, y: y };

      // Cạnh phải (nối v1 và v2)
      const tRight = interpolate(v1, v2);
      const pRight: Point = { x: x + 1, y: y + tRight };

      // Cạnh dưới (nối v3 và v2)
      const tBottom = interpolate(v3, v2);
      const pBottom: Point = { x: x + tBottom, y: y + 1 };

      // Cạnh trái (nối v0 và v3)
      const tLeft = interpolate(v0, v3);
      const pLeft: Point = { x: x, y: y + tLeft };

      // Thêm các phân đoạn đường biên tương ứng với từng trạng thái Marching Squares
      switch (state) {
        case 1:  // BL
          segments.push([pLeft, pBottom]);
          break;
        case 2:  // BR
          segments.push([pBottom, pRight]);
          break;
        case 3:  // BL, BR -> Ngang
          segments.push([pLeft, pRight]);
          break;
        case 4:  // TR
          segments.push([pTop, pRight]);
          break;
        case 5:  // TR, BL -> Điểm yên ngựa (Saddle) - chia làm 2 đường chéo
          segments.push([pLeft, pTop]);
          segments.push([pBottom, pRight]);
          break;
        case 6:  // TR, BR -> Dọc
          segments.push([pTop, pBottom]);
          break;
        case 7:  // TR, BR, BL -> Cạnh trên-trái
          segments.push([pTop, pLeft]);
          break;
        case 8:  // TL
          segments.push([pTop, pLeft]);
          break;
        case 9:  // TL, BL -> Dọc
          segments.push([pTop, pBottom]);
          break;
        case 10: // TL, BR -> Điểm yên ngựa (Saddle)
          segments.push([pLeft, pBottom]);
          segments.push([pTop, pRight]);
          break;
        case 11: // TL, BR, BL
          segments.push([pTop, pRight]);
          break;
        case 12: // TL, TR -> Ngang
          segments.push([pLeft, pRight]);
          break;
        case 13: // TL, TR, BL
          segments.push([pBottom, pRight]);
          break;
        case 14: // TL, TR, BR
          segments.push([pLeft, pBottom]);
          break;
      }
    }
  }

  return segments;
}

/**
 * Ghép nối các đoạn thẳng phân tán thành các đường bao (loops) khép kín hoặc liên tục liên tục.
 * Sử dụng Spatial Hashing để tối ưu hóa thời gian chạy từ O(N^2) xuống O(N).
 */
export function linkSegments(segments: Segment[]): Point[][] {
  const loops: Point[][] = [];
  if (segments.length === 0) return loops;

  // Bản đồ kề để tìm kiếm điểm nối cực nhanh
  const adj = new Map<string, number[]>();
  
  // Hàm tạo mã băm cho tọa độ điểm (làm tròn để tránh lỗi số thực)
  const getHash = (p: Point) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`;

  for (let i = 0; i < segments.length; i++) {
    const [p1, p2] = segments[i];
    const h1 = getHash(p1);
    const h2 = getHash(p2);

    if (!adj.has(h1)) adj.set(h1, []);
    if (!adj.has(h2)) adj.set(h2, []);

    adj.get(h1)!.push(i);
    adj.get(h2)!.push(i);
  }

  const visited = new Set<number>();

  for (let i = 0; i < segments.length; i++) {
    if (visited.has(i)) continue;

    const currentLoop: Point[] = [];
    let segIdx = i;
    visited.add(segIdx);

    let [pStart, pEnd] = segments[segIdx];
    currentLoop.push(pStart);
    currentLoop.push(pEnd);

    let currentPoint = pEnd;
    let keepGoing = true;

    while (keepGoing) {
      const hash = getHash(currentPoint);
      const candidates = adj.get(hash) || [];
      let foundNext = false;

      for (const nextIdx of candidates) {
        if (!visited.has(nextIdx)) {
          visited.add(nextIdx);
          const [n1, n2] = segments[nextIdx];
          const h1 = getHash(n1);

          if (h1 === hash) {
            currentPoint = n2;
          } else {
            currentPoint = n1;
          }
          currentLoop.push(currentPoint);
          foundNext = true;
          break;
        }
      }

      if (!foundNext) {
        keepGoing = false;
      }
    }

    // Chỉ giữ lại các đường nét có từ 3 điểm trở lên (bỏ các đường rác cực nhỏ)
    if (currentLoop.length >= 2) {
      loops.push(currentLoop);
    }
  }

  return loops;
}

/**
 * Khoảng cách bình phương giữa 2 điểm
 */
function getSqDist(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

/**
 * Khoảng cách bình phương từ một điểm đến một đoạn thẳng nối p1-p2
 */
function getSqSegDist(p: Point, p1: Point, p2: Point): number {
  let x = p1.x;
  let y = p1.y;
  let dx = p2.x - x;
  let dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;

  return dx * dx + dy * dy;
}

/**
 * Thuật toán đơn giản hóa đường gấp khúc Ramer-Douglas-Peucker (RDP)
 * Giúp giảm số lượng đỉnh và làm mượt đường vector.
 */
export function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2 || epsilon <= 0) return points;

  let maxSqDist = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const sqDist = getSqSegDist(points[i], points[0], points[end]);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  const sqEpsilon = epsilon * epsilon;

  if (maxSqDist > sqEpsilon) {
    const results1 = rdpSimplify(points.slice(0, index + 1), epsilon);
    const results2 = rdpSimplify(points.slice(index), epsilon);
    return results1.slice(0, results1.length - 1).concat(results2);
  } else {
    return [points[0], points[end]];
  }
}

/**
 * Tạo chuỗi đường dẫn SVG (SVG d path string) dạng trơn mượt sử dụng đường cong Bézier bậc hai
 * hoặc nét vẽ đa giác thẳng thông thường.
 */
export function buildPathString(points: Point[], useBezier: boolean): string {
  if (points.length === 0) return '';
  if (points.length < 3) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  if (!useBezier) {
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
    // Nếu điểm đầu và điểm cuối gần nhau, coi như khép kín đường vẽ
    const pStart = points[0];
    const pEnd = points[points.length - 1];
    const distSq = getSqDist(pStart, pEnd);
    if (distSq < 4) {
      d += ' Z';
    }
    return d;
  }

  // Thuật toán làm mịn sử dụng quadratic bezier qua các trung điểm
  let d = '';
  const p0 = points[0];
  const p1 = points[1];
  const startX = (p0.x + p1.x) / 2;
  const startY = (p0.y + p1.y) / 2;

  d += `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} L ${startX.toFixed(1)} ${startY.toFixed(1)}`;

  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const nextMidX = (curr.x + next.x) / 2;
    const nextMidY = (curr.y + next.y) / 2;
    d += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}, ${nextMidX.toFixed(1)} ${nextMidY.toFixed(1)}`;
  }

  const pLast = points[points.length - 1];
  d += ` L ${pLast.x.toFixed(1)} ${pLast.y.toFixed(1)}`;

  const distSq = getSqDist(p0, pLast);
  if (distSq < 4) {
    d += ' Z';
  }

  return d;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Download,
  Copy,
  FileImage,
  Sliders,
  RefreshCw,
  Check,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Sparkles,
  Cpu,
  Eye,
  Palette,
  Layers,
  Scissors,
  Compass,
  Info
} from 'lucide-react';
import {
  preprocessImage,
  traceContours,
  linkSegments,
  rdpSimplify,
  buildPathString,
  Point
} from './utils/vectorizer';
import { sampleOptions, renderSampleToDataUrl } from './samples/drawSamples';

export default function App() {
  // Nạp ảnh gốc
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);

  // Bộ lọc tiền xử lý ảnh
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(20);
  const [threshold, setThreshold] = useState<number>(128);

  // Tham số chuyển đổi vector
  const [rdpEpsilon, setRdpEpsilon] = useState<number>(1.0);
  const [useBezier, setUseBezier] = useState<boolean>(true);
  const [invertColors, setInvertColors] = useState<boolean>(false);
  const [isFillMode, setIsFillMode] = useState<boolean>(true); // true = Solid Fill, false = Outline Stroke
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [noiseFilter, setNoiseFilter] = useState<number>(4); // Bỏ các đường bao có số điểm ít hơn giá trị này

  // Tùy chọn hiển thị màu sắc
  const [vectorColor, setVectorColor] = useState<string>('#1a1a1a');
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [useTransparentBg, setUseTransparentBg] = useState<boolean>(true);

  // Trạng thái ứng dụng
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'sideBySide' | 'vectorOnly' | 'thresholdOnly'>('sideBySide');
  const [zoom, setZoom] = useState<number>(100);
  const [showAnchors, setShowAnchors] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<string>('logo');

  // Thống kê kết quả
  const [stats, setStats] = useState<{
    rawSegmentsCount: number;
    totalPathsCount: number;
    finalPathsCount: number;
    totalPointsCount: number;
    filteredCount: number;
  } | null>(null);

  // Kết quả vector hóa dạng mảng tọa độ thô để vẽ và chuỗi SVG d string
  const [simplifiedLoops, setSimplifiedLoops] = useState<Point[][]>([]);
  const [svgContent, setSvgContent] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nạp ảnh mẫu khởi tạo
  useEffect(() => {
    loadSample(1);
  }, []);

  const loadSample = (sampleId: number) => {
    setIsProcessing(true);
    const dataUrl = renderSampleToDataUrl(sampleId);
    if (dataUrl) {
      handleImageLoad(dataUrl);
    }
  };

  // Tiền xử lý tải ảnh
  const handleImageLoad = (src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Giới hạn chiều dài/rộng tối đa là 900px để xử lý thời gian thực mượt mà mà vẫn siêu nét
      const maxDim = 900;
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
  };

  // Kéo thả và tải file lên
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleImageLoad(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  // Định nghĩa các cấu hình preset thiết lập sẵn
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    switch (preset) {
      case 'logo': // Logo, Đồ họa sắc nét tô đặc
        setThreshold(128);
        setBrightness(0);
        setContrast(30);
        setRdpEpsilon(1.0);
        setUseBezier(true);
        setIsFillMode(true);
        setNoiseFilter(4);
        break;
      case 'sketch': // Phác thảo nét chì mỏng
        setThreshold(150);
        setBrightness(10);
        setContrast(15);
        setRdpEpsilon(0.6);
        setUseBezier(true);
        setIsFillMode(false);
        setStrokeWidth(2.5);
        setNoiseFilter(3);
        break;
      case 'technical': // Bản vẽ kỹ thuật góc cạnh
        setThreshold(120);
        setBrightness(0);
        setContrast(40);
        setRdpEpsilon(0.3);
        setUseBezier(false);
        setIsFillMode(false);
        setStrokeWidth(1.5);
        setNoiseFilter(2);
        break;
      case 'artistic': // Phong cách nét dày đậm
        setThreshold(135);
        setBrightness(-5);
        setContrast(25);
        setRdpEpsilon(1.8);
        setUseBezier(true);
        setIsFillMode(true);
        setNoiseFilter(6);
        break;
    }
  };

  // Thực thi quy trình Vector hóa chính dạng phản ứng (Reactive pipeline)
  useEffect(() => {
    if (!originalImageData) return;

    setIsProcessing(true);

    const timer = setTimeout(() => {
      try {
        // Bước 1: Tiền xử lý ảnh (Độ sáng, Độ tương phản, Ảnh xám)
        const { grayscale } = preprocessImage(originalImageData, brightness, contrast);

        // Bước 2: Chạy Marching Squares trích xuất đoạn thẳng viền
        const segments = traceContours(grayscale, imageWidth, imageHeight, threshold, invertColors);

        // Bước 3: Liên kết các đoạn viền rải rác thành các đường bao (loops) khép kín
        const loops = linkSegments(segments);

        // Bước 4: Đơn giản hóa RDP và gom các nhóm tọa độ hợp lệ
        const finalLoops: Point[][] = [];
        const paths: string[] = [];
        let totalPoints = 0;
        let filteredCount = 0;

        for (const loop of loops) {
          // Lọc bỏ nhiễu pixel nhỏ
          if (loop.length < noiseFilter) {
            filteredCount++;
            continue;
          }

          // Ramer-Douglas-Peucker đơn giản hóa và làm mịn
          const simplified = rdpSimplify(loop, rdpEpsilon);
          
          if (simplified.length >= 2) {
            finalLoops.push(simplified);
            totalPoints += simplified.length;

            // Chuyển tập điểm thành d string
            const dStr = buildPathString(simplified, useBezier);
            if (dStr) {
              paths.push(dStr);
            }
          }
        }

        // Bước 5: Cập nhật biến hiển thị
        setSimplifiedLoops(finalLoops);

        // Bước 6: Tạo chuỗi định dạng tệp SVG tiêu chuẩn
        const bg = useTransparentBg ? 'transparent' : backgroundColor;
        const sWidth = isFillMode ? 0 : strokeWidth;

        const pathElements = isFillMode
          ? `<path d="${paths.join(' ')}" fill="${vectorColor}" fill-rule="evenodd" stroke="none" />`
          : paths.map(d => `<path d="${d}" fill="none" stroke="${vectorColor}" stroke-width="${sWidth}" stroke-linecap="round" stroke-linejoin="round" />`).join('\n  ');

        const generatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imageWidth} ${imageHeight}" width="100%" height="100%" style="background-color: ${bg};">
  ${pathElements}
</svg>`;

        setSvgContent(generatedSvg);

        setStats({
          rawSegmentsCount: segments.length,
          totalPathsCount: loops.length,
          finalPathsCount: finalLoops.length,
          totalPointsCount: totalPoints,
          filteredCount
        });

        // Cập nhật canvas hiển thị nhị phân trắng đen tương thích
        updateGrayscaleCanvas(grayscale);

      } catch (err) {
        console.error('Lỗi khi vector hóa ảnh:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [
    originalImageData,
    brightness,
    contrast,
    threshold,
    rdpEpsilon,
    useBezier,
    invertColors,
    isFillMode,
    strokeWidth,
    vectorColor,
    backgroundColor,
    useTransparentBg,
    noiseFilter,
    imageWidth,
    imageHeight
  ]);

  // Cập nhật Canvas trắng đen thực tế thuật toán nhìn thấy
  const updateGrayscaleCanvas = (grayscale: Uint8Array) => {
    const canvas = document.getElementById('grayscale-preview-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const imgData = ctx.createImageData(imageWidth, imageHeight);
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
  };

  // Copy và Download mã nguồn
  const handleCopySvg = () => {
    if (!svgContent) return;
    navigator.clipboard.writeText(svgContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vectorized-drawing-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgContent) return;

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Xuất PNG độ phân giải 2x cực kỳ sắc nét
      const scale = 2.0;
      const canvas = document.createElement('canvas');
      canvas.width = imageWidth * scale;
      canvas.height = imageHeight * scale;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = useTransparentBg ? 'rgba(0,0,0,0)' : backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngURL;
        downloadLink.download = `vectorized-drawing-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(blobURL);
    };
    img.src = blobURL;
  };

  // Tạo mã hiển thị đường dẫn d của các loop trong React để vẽ nét mượt mà
  const reactPaths = useMemo(() => {
    return simplifiedLoops.map(loop => buildPathString(loop, useBezier));
  }, [simplifiedLoops, useBezier]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white" id="vectorizer-root">
      {/* HEADER BAR */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm">
            <Cpu className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                Vectra B&W SVG
              </h1>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-mono px-1.5 py-0.5 rounded border border-indigo-100 font-bold uppercase tracking-wider">
                Tracing Engine v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuyển đổi phác thảo nét vẽ tay thành Vector SVG một màu cực nét
            </p>
          </div>
        </div>

        {/* Preset nhanh */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500 px-2.5">Preset:</span>
          <div className="flex gap-0.5">
            {[
              { id: 'logo', label: 'Tô Đặc (Logo)', icon: Palette },
              { id: 'sketch', label: 'Bút Chì (Sketch)', icon: Scissors },
              { id: 'technical', label: 'Kỹ Thuật', icon: Compass },
              { id: 'artistic', label: 'Nghệ Thuật', icon: Sparkles }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activePreset === preset.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <preset.icon className="w-3.5 h-3.5" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* WORKSPACE CONTAINER */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* SIDEBAR: CONTROLS (Lg: col-span-4) */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-white p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-77px)] custom-scrollbar">
          
          {/* MỤC 1: TẢI ẢNH & ẢNH MẪU */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-500" />
              1. Tải Lên & Chọn Hình Vẽ
            </h3>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-2 relative z-10">
                <div className="mx-auto w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform duration-200">
                  <FileImage className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Kéo thả hình vào đây hoặc <span className="text-indigo-600 underline">chọn tệp</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Hỗ trợ PNG, JPG, WebP. Nên chọn ảnh vẽ tương phản cao.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Samples */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500">Hoặc thử ngay với các mẫu vẽ tay:</label>
              <div className="grid grid-cols-3 gap-2">
                {sampleOptions.map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => loadSample(sample.id)}
                    className="group relative flex flex-col justify-end p-2.5 rounded-lg border border-slate-200 hover:border-indigo-500 bg-white text-left transition-all duration-200 cursor-pointer overflow-hidden h-16 shadow-sm hover:shadow"
                  >
                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 truncate w-full">
                      {sample.label}
                    </span>
                    <span className="text-[9px] text-slate-500 line-clamp-1 w-full mt-0.5 leading-tight">
                      {sample.desc}
                    </span>
                    <div className="absolute right-1 top-1 text-slate-300 group-hover:text-indigo-500 transition-colors">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MỤC 2: CÂN CHỈNH ẢNH (PRE-PROCESSING) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              2. Cân Chỉnh Độ Tương Phản & Ngưỡng
            </h3>

            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Độ Sáng (Brightness)</span>
                <span className="font-mono text-emerald-600">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Độ Tương Phản (Contrast)</span>
                <span className="font-mono text-emerald-600">{contrast > 0 ? `+${contrast}` : contrast}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Threshold */}
            <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  Ngưỡng Trắng Đen (Threshold)
                </span>
                <span className="font-mono bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-700 text-[10px] font-bold">
                  {threshold} / 255
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Tăng ngưỡng để gộp thêm các nét nhạt; giảm ngưỡng để loại bỏ các guideline thừa bằng bút chì hoặc vệt bụi giấy.
              </p>
            </div>
          </div>

          {/* MỤC 3: THAM SỐ VECTOR (TRACE PARAMETERS) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              3. Tùy Chỉnh Nét Vẽ Vector
            </h3>

            {/* Trace Mode (Fill or Stroke) */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-500">Phương Thức Trích Xuất Nét</span>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setIsFillMode(true)}
                  className={`py-1.5 text-xs font-bold rounded transition-all ${
                    isFillMode
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tô Đặc (Solid Fill)
                </button>
                <button
                  onClick={() => setIsFillMode(false)}
                  className={`py-1.5 text-xs font-bold rounded transition-all ${
                    !isFillMode
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đường Viền (Stroke)
                </button>
              </div>
            </div>

            {/* Stroke Width Slider (only visible in stroke mode) */}
            {!isFillMode && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Độ dày đường nét (Stroke Width)</span>
                  <span className="font-mono text-indigo-600">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}

            {/* Simplify Factor (RDP Epsilon) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Độ Đơn Giản Hóa (Smoothing)</span>
                <span className="font-mono text-indigo-600">ε = {rdpEpsilon.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="4.0"
                step="0.1"
                value={rdpEpsilon}
                onChange={(e) => setRdpEpsilon(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Nét gấp khúc (Chi tiết)</span>
                <span>Nét mượt mà (Tối giản)</span>
              </div>
            </div>

            {/* Noise Filter */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Bộ Lọc Khử Nhiễu (Noise Filter)</span>
                <span className="font-mono text-indigo-600">&gt; {noiseFilter} điểm</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={noiseFilter}
                onChange={(e) => setNoiseFilter(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[10px] text-slate-500">
                Loại bỏ các đường khép kín vụn vặt có số đỉnh nhỏ hơn ngưỡng để giữ sản phẩm vector hoàn toàn sạch sẽ.
              </p>
            </div>

            {/* Checkbox Toggles */}
            <div className="pt-2 space-y-2.5 border-t border-slate-200">
              {/* Bezier smoothing */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useBezier}
                  onChange={(e) => setUseBezier(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-600">Sử dụng đường cong Bézier trơn</span>
              </label>

              {/* Invert Colors */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={invertColors}
                  onChange={(e) => setInvertColors(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-600">Đảo ngược màu nhị phân (Invert)</span>
              </label>
            </div>
          </div>

          {/* MỤC 4: TÙY CHỌN MÀU SẮC */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-500" />
              4. Cấu Hình Màu Sắc SVG
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Vector Color */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500">Màu nét vẽ / tô</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={vectorColor}
                    onChange={(e) => setVectorColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={vectorColor}
                    onChange={(e) => setVectorColor(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-700 font-mono px-2 py-1 rounded border border-slate-200"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500">Màu nền SVG</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    disabled={useTransparentBg}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className={`w-8 h-8 rounded border border-slate-300 bg-transparent cursor-pointer ${
                      useTransparentBg ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                  />
                  <input
                    type="text"
                    value={useTransparentBg ? 'Transparent' : backgroundColor}
                    disabled={useTransparentBg}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className={`w-full bg-slate-50 text-xs text-slate-700 font-mono px-2 py-1 rounded border border-slate-200 ${
                      useTransparentBg ? 'opacity-40 text-slate-400 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Transparent background switch */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useTransparentBg}
                onChange={(e) => setUseTransparentBg(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-600">Thiết lập nền trong suốt (Transparent)</span>
            </label>
          </div>

          {/* MỤC 5: XUẤT FILE & MÃ NGUỒN */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <button
                onClick={handleDownloadSvg}
                disabled={!svgContent}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Tải Xuống SVG (.svg)
              </button>

              <button
                onClick={handleDownloadPng}
                disabled={!svgContent}
                className="bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-slate-200 shadow-sm"
                title="Tải ảnh dạng PNG độ phân giải cao"
              >
                Tải ảnh PNG (2x)
              </button>
            </div>

            <button
              onClick={handleCopySvg}
              disabled={!svgContent}
              className="w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-pointer active:scale-[0.99] transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                  Đã sao chép mã SVG!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Sao chép mã nguồn SVG
                </>
              )}
            </button>
          </div>

        </div>

        {/* WORKSPACE AREA: VIEWPORTS (Lg: col-span-8) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-50 p-4 space-y-4 max-h-[calc(100vh-77px)] overflow-hidden">
          
          {/* VIEW CONTROLLERS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {[
                { id: 'sideBySide', label: 'So Sánh (Side-by-Side)', icon: Layers },
                { id: 'vectorOnly', label: 'Vector SVG Kết Quả', icon: Eye },
                { id: 'thresholdOnly', label: 'Lưới Nhị Phân (B&W)', icon: SlidersHorizontal }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-150 ${
                    viewMode === tab.id
                      ? 'bg-white text-indigo-600 border border-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Zoom Controls & View Extras */}
            <div className="flex items-center gap-3">
              {/* Toggle Checkerboard */}
              {useTransparentBg && (
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCheckerboard}
                    onChange={(e) => setShowCheckerboard(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 bg-white border-slate-300"
                  />
                  Caro nền trong suốt
                </label>
              )}

              {/* Show Anchors Toggle */}
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none border-l border-slate-200 pl-3">
                <input
                  type="checkbox"
                  checked={showAnchors}
                  onChange={(e) => setShowAnchors(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 bg-white border-slate-300"
                />
                Hiển thị điểm Neo (Anchors)
              </label>

              {/* Zoom Panel */}
              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono font-medium text-slate-600 px-1 w-10 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(500, zoom + 25))}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 transition-colors"
                  title="Đặt lại 100%"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* MAIN PREVIEW AREA */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[300px] flex items-center justify-center">
            
            {/* Loading Indicator */}
            {isProcessing && (
              <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur border border-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span className="text-[11px] font-bold text-indigo-600">Đang trích xuất nét...</span>
              </div>
            )}

            {/* MAIN VIEWS GRID */}
            <div className="w-full h-full flex items-center justify-center p-6 relative overflow-auto custom-scrollbar">
              
              <AnimatePresence mode="wait">
                
                {/* 1. SIDE-BY-SIDE VIEW */}
                {viewMode === 'sideBySide' && (
                  <motion.div
                    key="sideBySide"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full"
                  >
                    {/* Left: Original Drawing */}
                    <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden relative">
                      <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                        <span>ẢNH GỐC / PHÁC THẢO BAN ĐẦU</span>
                        <span className="text-[10px] bg-white border border-slate-200 text-slate-500 font-mono px-1.5 py-0.5 rounded shadow-sm">
                          {imageWidth}x{imageHeight}px
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-center p-4 min-h-[250px] relative bg-slate-50/20">
                        {imageSrc ? (
                          <div
                            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                            className="transition-transform duration-200 max-w-full max-h-full flex items-center justify-center"
                          >
                            <img
                              src={imageSrc}
                              alt="Original drawing"
                              className="max-w-full max-h-[350px] object-contain rounded shadow-sm pointer-events-none border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="text-center text-slate-400">
                            <FileImage className="w-12 h-12 mx-auto stroke-[1] mb-2 text-slate-300" />
                            <p className="text-xs">Chưa tải ảnh lên</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Vector SVG Output */}
                    <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden relative">
                      <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                        <span>BẢN VECTOR HÓA SVG MỘT MÀU</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 font-mono px-1.5 py-0.5 rounded border border-indigo-100 font-bold uppercase shadow-sm">
                          Hao tổn &lt; 5%
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-center p-4 min-h-[250px] relative bg-slate-50/20">
                        {/* Checkerboard Pattern for Transparent BG preview */}
                        {showCheckerboard && useTransparentBg && (
                          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                        )}
                        {imageSrc && stats ? (
                          <div
                            style={{
                              transform: `scale(${zoom / 100})`,
                              transformOrigin: 'center center',
                              backgroundColor: useTransparentBg ? 'transparent' : backgroundColor
                            }}
                            className="transition-transform duration-200 w-full max-w-full max-h-[350px] h-[350px] rounded shadow-sm overflow-hidden flex items-center justify-center relative border border-slate-100"
                          >
                            {/* Render React SVG for ultra interactive fidelity & Anchor overlays */}
                            <svg
                              viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                              className="w-full h-full object-contain select-none"
                              style={{ backgroundColor: useTransparentBg ? 'transparent' : backgroundColor }}
                            >
                              {isFillMode ? (
                                <path
                                  d={reactPaths.join(' ')}
                                  fill={vectorColor}
                                  fillRule="evenodd"
                                  stroke="none"
                                />
                              ) : (
                                reactPaths.map((dStr, idx) => (
                                  <path
                                    key={idx}
                                    d={dStr}
                                    fill="none"
                                    stroke={vectorColor}
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                ))
                              )}

                              {/* Hiển thị điểm neo nếu bật */}
                              {showAnchors && simplifiedLoops.map((loop, lIdx) =>
                                loop.map((pt, pIdx) => (
                                  <circle
                                    key={`${lIdx}-${pIdx}`}
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={Math.max(1, 1.5 * (imageWidth / 420))}
                                    className="fill-indigo-500 stroke-white cursor-pointer hover:fill-amber-500 transition-colors"
                                    strokeWidth={Math.max(0.3, 0.5 * (imageWidth / 420))}
                                  />
                                ))
                              )}
                            </svg>
                          </div>
                        ) : (
                          <div className="text-center text-slate-400">
                            <Cpu className="w-12 h-12 mx-auto stroke-[1] mb-2 text-slate-300 animate-spin" />
                            <p className="text-xs">Đang nạp thuật toán...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. VECTOR ONLY VIEW */}
                {viewMode === 'vectorOnly' && (
                  <motion.div
                    key="vectorOnly"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="w-full h-full flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                  >
                    <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                      <span>CHẾ ĐỘ XEM TRỌN VẸN VECTOR</span>
                      <span className="text-[10px] text-slate-400">Không răng cưa pixel khi phóng to</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8 min-h-[400px] relative bg-slate-50/10">
                      {showCheckerboard && useTransparentBg && (
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                      )}
                      {imageSrc && stats ? (
                        <div
                          style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'center center',
                            backgroundColor: useTransparentBg ? 'transparent' : backgroundColor
                          }}
                          className="transition-transform duration-200 w-full max-w-full max-h-[420px] h-[420px] rounded shadow-sm flex items-center justify-center border border-slate-100"
                        >
                          <svg
                            viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                            className="w-full h-full object-contain select-none"
                          >
                            {isFillMode ? (
                              <path
                                d={reactPaths.join(' ')}
                                fill={vectorColor}
                                fillRule="evenodd"
                                stroke="none"
                              />
                            ) : (
                              reactPaths.map((dStr, idx) => (
                                <path
                                  key={idx}
                                  d={dStr}
                                  fill="none"
                                  stroke={vectorColor}
                                  strokeWidth={strokeWidth}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              ))
                            )}

                            {/* Anchor nodes layer */}
                            {showAnchors && simplifiedLoops.map((loop, lIdx) =>
                              loop.map((pt, pIdx) => (
                                <circle
                                  key={`${lIdx}-${pIdx}`}
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={Math.max(1, 1.3 * (imageWidth / 420))}
                                  className="fill-indigo-500 stroke-white"
                                  strokeWidth={Math.max(0.3, 0.5 * (imageWidth / 420))}
                                />
                              ))
                            )}
                          </svg>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                )}

                {/* 3. THRESHOLD GRayscale PREVIEW VIEW */}
                {viewMode === 'thresholdOnly' && (
                  <motion.div
                    key="thresholdOnly"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="w-full h-full flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                  >
                    <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                      <span>ẢNH NHỊ PHÂN THỰC TẾ (1-BIT BINARY)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded shadow-sm">
                        Mắt quét thuật toán
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8 min-h-[400px] bg-slate-50/10 relative">
                      <div
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                        className="transition-transform duration-200 w-full max-w-full max-h-[420px] h-[420px] flex items-center justify-center"
                      >
                        <canvas
                          id="grayscale-preview-canvas"
                          className="max-w-full max-h-full object-contain rounded shadow-sm border border-slate-200"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>
          </div>

          {/* STATISTICS BAR & EXPLANATIONS */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center shadow-sm">
            
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ phân giải</span>
              <span className="text-sm font-mono font-bold text-slate-700">
                {imageWidth && imageHeight ? `${imageWidth} × ${imageHeight}` : '---'}
              </span>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Phân đoạn viền</span>
              <span className="text-sm font-mono font-bold text-slate-700">
                {stats ? stats.rawSegmentsCount.toLocaleString() : '---'}
              </span>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Đường nét khép kín</span>
              <span className="text-sm font-mono font-bold text-emerald-600">
                {stats ? stats.finalPathsCount.toLocaleString() : '---'}
              </span>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng số điểm neo</span>
              <span className="text-sm font-mono font-bold text-indigo-600">
                {stats ? stats.totalPointsCount.toLocaleString() : '---'}
              </span>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-2 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Đã Khử nhiễu rác</span>
              <span className="text-xs font-mono font-semibold text-pink-600">
                {stats ? `${stats.filteredCount} vệt` : '---'}
              </span>
            </div>

          </div>

          {/* HƯỚNG DẪN SỬ DỤNG NHANH */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-slate-500 text-[11px] leading-normal flex gap-2.5 items-start shadow-sm">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700 block mb-0.5">Mẹo tối ưu hóa đường vẽ:</span>
              Để có nét SVG mềm mại mượt mà nhất, hãy kéo thanh trượt <strong className="text-slate-700">ε (Smoothing)</strong> lên khoảng <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono font-bold">1.0</code> - <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono font-bold">1.5</code>, bật checkbox <strong className="text-slate-700">Sử dụng đường cong Bézier</strong> và giảm bớt hạt cát bụi giấy bằng <strong className="text-slate-700">Bộ lọc khử nhiễu</strong>.
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

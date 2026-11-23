'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type ToolTab = 'resize' | 'background';

interface ResizePreset {
  name: string;
  width: number;
  height: number;
  targetKb?: number;
  desc: string;
}

const PRESETS: ResizePreset[] = [
  { name: 'Custom', width: 0, height: 0, desc: 'Set your own width, height, and file size' },
  { name: 'SSC / RRB Photo', width: 200, height: 230, targetKb: 45, desc: '3.5 x 4.5 cm (20 KB - 50 KB)' },
  { name: 'SSC / RRB Signature', width: 140, height: 60, targetKb: 18, desc: 'Scan Signature (10 KB - 20 KB)' },
  { name: 'UPSC / State PSC Photo', width: 350, height: 450, targetKb: 80, desc: 'Standard Form (50 KB - 100 KB)' },
  { name: 'Standard Passport', width: 413, height: 531, targetKb: 100, desc: '3.5 x 4.5 cm high resolution' },
];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>('resize');

  // ==========================================
  // Tool 1: Image Resize & Compress State
  // ==========================================
  const [resizeImage, setResizeImage] = useState<string | null>(null);
  const [resizeFileName, setResizeFileName] = useState<string>('photo');
  const [origDimensions, setOrigDimensions] = useState<{ w: number; h: number; kb: number }>({ w: 0, h: 0, kb: 0 });
  const [targetWidth, setTargetWidth] = useState<number>(200);
  const [targetHeight, setTargetHeight] = useState<number>(230);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [targetMaxKb, setTargetMaxKb] = useState<number>(45);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const [resizedKb, setResizedKb] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('SSC / RRB Photo');
  const [isProcessingResize, setIsProcessingResize] = useState<boolean>(false);
  const resizeInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // Tool 2: Image Background Change State
  // ==========================================
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgFileName, setBgFileName] = useState<string>('photo');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [tolerance, setTolerance] = useState<number>(28);
  const [processedBgImage, setProcessedBgImage] = useState<string | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  // ------------------------------------------
  // Resize Tool Handlers
  // ------------------------------------------
  const handleResizeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResizeFileName(file.name.replace(/\.[^/.]+$/, ''));
    const kb = Math.round(file.size / 1024);

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setResizeImage(src);

      const img = new Image();
      img.onload = () => {
        setOrigDimensions({ w: img.width, h: img.height, kb });
        if (selectedPreset === 'Custom') {
          setTargetWidth(img.width);
          setTargetHeight(img.height);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const p = PRESETS.find((x) => x.name === presetName);
    if (!p) return;

    if (p.width > 0 && p.height > 0) {
      setTargetWidth(p.width);
      setTargetHeight(p.height);
      setLockRatio(false);
    }
    if (p.targetKb) {
      setTargetMaxKb(p.targetKb);
    }
  };

  const handleWidthChange = (w: number) => {
    setTargetWidth(w);
    if (lockRatio && origDimensions.w > 0) {
      const ratio = origDimensions.h / origDimensions.w;
      setTargetHeight(Math.round(w * ratio));
    }
  };

  const handleHeightChange = (h: number) => {
    setTargetHeight(h);
    if (lockRatio && origDimensions.h > 0) {
      const ratio = origDimensions.w / origDimensions.h;
      setTargetWidth(Math.round(h * ratio));
    }
  };

  // Process Resize
  useEffect(() => {
    if (!resizeImage || targetWidth <= 0 || targetHeight <= 0) return;

    setIsProcessingResize(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessingResize(false);
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // White fill if format is JPEG to prevent transparent areas turning black
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Iterate compression to reach target KB
      let minQ = 0.1;
      let maxQ = 0.98;
      let bestDataUrl = canvas.toDataURL(format, 0.92);
      let bestKb = Math.round((bestDataUrl.length * 3) / 4 / 1024);

      if (targetMaxKb > 0 && format !== 'image/png') {
        for (let i = 0; i < 7; i++) {
          const midQ = (minQ + maxQ) / 2;
          const dataUrl = canvas.toDataURL(format, midQ);
          const currentKb = Math.round((dataUrl.length * 3) / 4 / 1024);

          bestDataUrl = dataUrl;
          bestKb = currentKb;

          if (currentKb > targetMaxKb) {
            maxQ = midQ;
          } else if (currentKb < targetMaxKb * 0.75) {
            minQ = midQ;
          } else {
            break;
          }
        }
      }

      setResizedPreview(bestDataUrl);
      setResizedKb(bestKb);
      setIsProcessingResize(false);
    };
    img.src = resizeImage;
  }, [resizeImage, targetWidth, targetHeight, targetMaxKb, format]);

  // ------------------------------------------
  // Background Change Tool Handlers
  // ------------------------------------------
  const handleBgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBgFileName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setBgImage(src);
    };
    reader.readAsDataURL(file);
  };

  // Process Background Change (Chroma/Color Boundary Detection)
  useEffect(() => {
    if (!bgImage) return;

    setIsProcessingBg(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = img.width;
      const h = img.height;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setIsProcessingBg(false);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample border corner pixels to determine background reference color
      const samplePoints = [
        0, // top-left
        (w - 1) * 4, // top-right
        Math.floor(w / 2) * 4, // top-center
        ((h - 1) * w) * 4, // bottom-left
        ((h - 1) * w + (w - 1)) * 4, // bottom-right
      ];

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      for (const idx of samplePoints) {
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
      }
      const refR = rSum / samplePoints.length;
      const refG = gSum / samplePoints.length;
      const refB = bSum / samplePoints.length;

      // Target background RGB
      let targetR = 255;
      let targetG = 255;
      let targetB = 255;
      if (!isTransparent) {
        const hex = bgColor.replace('#', '');
        if (hex.length === 6) {
          targetR = parseInt(hex.substring(0, 2), 16);
          targetG = parseInt(hex.substring(2, 4), 16);
          targetB = parseInt(hex.substring(4, 6), 16);
        }
      }

      const tolSq = (tolerance * 2.5) ** 2;

      // Flood & edge-aware pixel mask
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance from sampled background
        const distSq = (r - refR) ** 2 + (g - refG) ** 2 + (b - refB) ** 2;

        if (distSq < tolSq) {
          if (isTransparent) {
            data[i + 3] = 0; // Transparent
          } else {
            // Soft feathering
            const factor = Math.min(1, Math.sqrt(distSq / tolSq));
            data[i] = Math.round(targetR * (1 - factor) + r * factor);
            data[i + 1] = Math.round(targetG * (1 - factor) + g * factor);
            data[i + 2] = Math.round(targetB * (1 - factor) + b * factor);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessedBgImage(canvas.toDataURL('image/png'));
      setIsProcessingBg(false);
    };
    img.src = bgImage;
  }, [bgImage, bgColor, isTransparent, tolerance]);

  return (
    <main className="tools-page-main">
      <style>{`
        .tools-page-main {
          min-height: calc(100vh - 140px);
          background: #f8fafc;
          padding: 24px 16px 80px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tools-container {
          max-width: 900px;
          margin: 0 auto;
        }
        .tools-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .tools-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .tools-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }
        .tab-switcher {
          display: flex;
          background: #e2e8f0;
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 24px;
          gap: 4px;
        }
        .tab-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          font-size: 0.92rem;
          font-weight: 700;
          color: #475569;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .tab-btn.active {
          background: #ffffff;
          color: #0066ff;
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.12);
        }
        .tool-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          margin-bottom: 24px;
        }
        .upload-dropzone {
          border: 2px dashed #93c5fd;
          background: #eff6ff;
          border-radius: 14px;
          padding: 32px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }
        .upload-dropzone:hover {
          border-color: #3b82f6;
          background: #dbeafe;
        }
        .upload-icon {
          width: 44px;
          height: 44px;
          margin: 0 auto 10px;
          color: #0066ff;
        }
        .upload-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 4px;
        }
        .upload-hint {
          font-size: 0.82rem;
          color: #64748b;
        }
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .preset-btn {
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          border-radius: 10px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .preset-btn:hover {
          border-color: #93c5fd;
          background: #f8fafc;
        }
        .preset-btn.active {
          border-color: #0066ff;
          background: #eff6ff;
        }
        .preset-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .preset-desc {
          font-size: 0.75rem;
          color: #64748b;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        .field-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }
        .input-text, .select-box {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 9px;
          font-size: 0.9rem;
          color: #0f172a;
          background: #fff;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .input-text:focus, .select-box:focus {
          border-color: #0066ff;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          margin-top: 8px;
        }
        .preview-container {
          background: #f1f5f9;
          border-radius: 14px;
          padding: 20px;
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .preview-img-box {
          max-width: 280px;
          max-height: 280px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 14px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .preview-img-box img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .preview-stats {
          display: flex;
          gap: 16px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .stat-badge {
          background: #ffffff;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }
        .stat-badge.highlight {
          background: #eff6ff;
          color: #0066ff;
          border-color: #bfdbfe;
        }
        .btn-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #0066ff;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 10px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 102, 255, 0.3);
        }
        .btn-download:hover {
          background: #0052cc;
          transform: translateY(-1px);
        }
        .color-palette {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 20px;
        }
        .color-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid #cbd5e1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          position: relative;
        }
        .color-circle.active {
          border-color: #0066ff;
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.35);
        }
        .exam-info-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 16px;
          font-size: 0.85rem;
          color: #166534;
          line-height: 1.6;
        }
        .exam-info-card strong {
          color: #14532d;
        }
      `}</style>

      <div className="tools-container">
        {/* Header */}
        <header className="tools-header">
          <h1 className="tools-title">Aspirant Photo &amp; Image Tools</h1>
          <p className="tools-subtitle">
            Free utility to resize photos, crop signatures, and adjust backgrounds for SSC, Railway, UPSC &amp; Govt exam forms.
          </p>
        </header>

        {/* Tab Switcher */}
        <div className="tab-switcher" role="tablist">
          <button
            type="button"
            className={`tab-btn${activeTab === 'resize' ? ' active' : ''}`}
            onClick={() => setActiveTab('resize')}
            role="tab"
            aria-selected={activeTab === 'resize'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M15 9l-6 6M9 9h6v6" />
            </svg>
            <span>Image Resize &amp; KB Compress</span>
          </button>

          <button
            type="button"
            className={`tab-btn${activeTab === 'background' ? ' active' : ''}`}
            onClick={() => setActiveTab('background')}
            role="tab"
            aria-selected={activeTab === 'background'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Image Background Change</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: Image Resize & Compress */}
        {/* ========================================================= */}
        {activeTab === 'resize' && (
          <div className="tool-card">
            <input
              type="file"
              ref={resizeInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleResizeFileSelect}
            />

            {!resizeImage ? (
              <div className="upload-dropzone" onClick={() => resizeInputRef.current?.click()}>
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="upload-title">Click or Drop Photo / Signature Here</div>
                <div className="upload-hint">Supports JPG, PNG, WEBP files up to 20 MB</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                    Original: {origDimensions.w} x {origDimensions.h} px ({origDimensions.kb} KB)
                  </div>
                  <button
                    type="button"
                    onClick={() => resizeInputRef.current?.click()}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Change Image
                  </button>
                </div>

                {/* Exam Presets */}
                <div className="field-label">Choose Exam Preset:</div>
                <div className="preset-grid">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      className={`preset-btn${selectedPreset === p.name ? ' active' : ''}`}
                      onClick={() => handlePresetChange(p.name)}
                    >
                      <div className="preset-name">{p.name}</div>
                      <div className="preset-desc">{p.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Dimension Inputs */}
                <div className="form-row">
                  <div>
                    <label className="field-label">Target Width (Pixels)</label>
                    <input
                      type="number"
                      className="input-text"
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="field-label">Target Height (Pixels)</label>
                    <input
                      type="number"
                      className="input-text"
                      value={targetHeight}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* File size & format */}
                <div className="form-row">
                  <div>
                    <label className="field-label">Target Max File Size (KB)</label>
                    <input
                      type="number"
                      className="input-text"
                      value={targetMaxKb}
                      onChange={(e) => setTargetMaxKb(Number(e.target.value))}
                    />
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={lockRatio}
                        onChange={(e) => setLockRatio(e.target.checked)}
                      />
                      <span>Lock Original Aspect Ratio</span>
                    </label>
                  </div>
                  <div>
                    <label className="field-label">Output Format</label>
                    <select
                      className="select-box"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                    >
                      <option value="image/jpeg">JPEG / JPG (Standard for Govt Forms)</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WEBP</option>
                    </select>
                  </div>
                </div>

                {/* Result Preview & Download */}
                {resizedPreview && (
                  <div className="preview-container">
                    <div className="preview-img-box">
                      <img src={resizedPreview} alt="Resized Result" />
                    </div>
                    <div className="preview-stats">
                      <div className="stat-badge">Dimensions: {targetWidth} × {targetHeight} px</div>
                      <div className="stat-badge highlight">File Size: ~{resizedKb} KB</div>
                    </div>
                    <a
                      href={resizedPreview}
                      download={`${resizeFileName}_resized_${targetWidth}x${targetHeight}.${format.split('/')[1]}`}
                      className="btn-download"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Download Resized Photo</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: Image Background Change */}
        {/* ========================================================= */}
        {activeTab === 'background' && (
          <div className="tool-card">
            <input
              type="file"
              ref={bgInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleBgFileSelect}
            />

            {!bgImage ? (
              <div className="upload-dropzone" onClick={() => bgInputRef.current?.click()}>
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <div className="upload-title">Click or Drop Passport Photo Here</div>
                <div className="upload-hint">Upload photo to convert background to plain White or Custom Color</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                    Select Target Background Color:
                  </div>
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Change Photo
                  </button>
                </div>

                {/* Color Palette */}
                <div className="color-palette">
                  {/* White */}
                  <div
                    className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#ffffff' ? ' active' : ''}`}
                    style={{ backgroundColor: '#ffffff' }}
                    onClick={() => { setBgColor('#ffffff'); setIsTransparent(false); }}
                    title="Pure White (SSC / RRB Standard)"
                  />
                  {/* Light Sky Blue */}
                  <div
                    className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#dbeafe' ? ' active' : ''}`}
                    style={{ backgroundColor: '#dbeafe' }}
                    onClick={() => { setBgColor('#dbeafe'); setIsTransparent(false); }}
                    title="Light Sky Blue"
                  />
                  {/* Cool Grey */}
                  <div
                    className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#f1f5f9' ? ' active' : ''}`}
                    style={{ backgroundColor: '#f1f5f9' }}
                    onClick={() => { setBgColor('#f1f5f9'); setIsTransparent(false); }}
                    title="Light Grey"
                  />
                  {/* Deep Blue */}
                  <div
                    className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#1e3a8a' ? ' active' : ''}`}
                    style={{ backgroundColor: '#1e3a8a' }}
                    onClick={() => { setBgColor('#1e3a8a'); setIsTransparent(false); }}
                    title="Deep Navy Blue"
                  />
                  {/* Red */}
                  <div
                    className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#ef4444' ? ' active' : ''}`}
                    style={{ backgroundColor: '#ef4444' }}
                    onClick={() => { setBgColor('#ef4444'); setIsTransparent(false); }}
                    title="Red Background"
                  />
                  {/* Transparent */}
                  <button
                    type="button"
                    className={`color-circle${isTransparent ? ' active' : ''}`}
                    style={{
                      background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px',
                      fontSize: '10px',
                      fontWeight: 700
                    }}
                    onClick={() => setIsTransparent(true)}
                    title="Transparent PNG"
                  >
                    PNG
                  </button>

                  {/* Custom color picker */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                    <span>Custom:</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => { setBgColor(e.target.value); setIsTransparent(false); }}
                      style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </label>
                </div>

                {/* Edge Tolerance Slider */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="field-label" style={{ margin: 0 }}>Background Removal Sensitivity / Tolerance</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0066ff' }}>{tolerance}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="65"
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                {/* Background Result Preview */}
                {processedBgImage && (
                  <div className="preview-container">
                    <div className="preview-img-box" style={{ background: isTransparent ? 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 12px 12px' : bgColor }}>
                      <img src={processedBgImage} alt="Background Changed Result" />
                    </div>
                    <div className="preview-stats">
                      <div className="stat-badge highlight">
                        Background: {isTransparent ? 'Transparent PNG' : bgColor.toUpperCase()}
                      </div>
                    </div>
                    <a
                      href={processedBgImage}
                      download={`${bgFileName}_new_bg.png`}
                      className="btn-download"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Download Updated Photo</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Govt Exam Photo Guidelines Notice */}
        <div className="exam-info-card">
          <strong>📌 Official Guidelines for SSC, Railway &amp; UPSC Application Photos:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li><strong>Background:</strong> Must be plain white or very light color (dark/shadowy backgrounds cause rejection).</li>
            <li><strong>Dimensions:</strong> Standard 3.5 cm width × 4.5 cm height (approx 200 × 230 pixels).</li>
            <li><strong>File Size:</strong> Photographs must be between <strong>20 KB and 50 KB</strong>. Signatures must be <strong>10 KB to 20 KB</strong>.</li>
            <li><strong>Face Coverage:</strong> At least 70-80% of photo area, looking directly into the camera with neutral expression. No hats, caps, or sunglasses.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

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

export default function ImageResizePage() {
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
  const resizeInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!resizeImage || targetWidth <= 0 || targetHeight <= 0) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

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
    };
    img.src = resizeImage;
  }, [resizeImage, targetWidth, targetHeight, targetMaxKb, format]);

  return (
    <main className="tool-screen-main">
      <style>{`
        .tool-screen-main {
          min-height: calc(100vh - 140px);
          background: #f8fafc;
          padding: 24px 16px 80px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tool-screen-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .back-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .btn-back-tools {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #0066ff;
          font-size: 0.92rem;
          font-weight: 700;
          text-decoration: none;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 8px 14px;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .btn-back-tools:hover {
          background: #dbeafe;
          transform: translateX(-2px);
        }
        .screen-badge {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          background: #e2e8f0;
          color: #475569;
          padding: 3px 8px;
          border-radius: 999px;
          letter-spacing: 0.04em;
        }
        .tool-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          margin-bottom: 24px;
        }
        .tool-header-block {
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .tool-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tool-desc {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
        }
        .upload-dropzone {
          border: 2px dashed #93c5fd;
          background: #eff6ff;
          border-radius: 14px;
          padding: 36px 20px;
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
          font-size: 1.05rem;
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
          .form-row { grid-template-columns: 1fr; }
          .tool-card { padding: 18px 14px; }
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
          gap: 12px;
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
        .exam-info-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 16px;
          font-size: 0.85rem;
          color: #166534;
          line-height: 1.6;
        }
        .exam-info-card strong { color: #14532d; }
      `}</style>

      <div className="tool-screen-container">
        {/* Navigation Bar */}
        <div className="back-nav-bar">
          <Link href="/tools" prefetch={true} className="btn-back-tools">
            <span>←</span> Back to All Tools
          </Link>
          <span className="screen-badge">Photo &amp; Signature</span>
        </div>

        <div className="tool-card">
          <div className="tool-header-block">
            <h1 className="tool-title">
              <span>📐</span> Image Resize &amp; KB Compress
            </h1>
            <p className="tool-desc">
              Resize photo (20-50 KB) and signature (10-20 KB) to exact pixels and target file size for SSC, Railway &amp; UPSC.
            </p>
          </div>

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
                <line x1="12" y1="15" x2="12" y2="3" />
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

        {/* Govt Exam Guidelines Notice */}
        <div className="exam-info-card">
          <strong>📌 Official Guidelines for SSC, Railway &amp; Govt Application Photos:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li><strong>Photo Dimensions:</strong> Standard 3.5 cm width × 4.5 cm height (approx 200 × 230 pixels).</li>
            <li><strong>File Size:</strong> Photographs must be between <strong>20 KB and 50 KB</strong>. Signatures must be <strong>10 KB to 20 KB</strong>.</li>
            <li><strong>Format:</strong> JPEG/JPG format is strictly required by TCS iON / SSC application portals.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

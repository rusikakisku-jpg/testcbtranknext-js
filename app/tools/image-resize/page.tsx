'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ResizePreset {
  name: string;
  width: number;
  height: number;
  targetKb?: number;
  badge?: string;
  desc: string;
}

const PRESETS: ResizePreset[] = [
  { name: 'Custom', width: 0, height: 0, desc: 'Set manual width, height & KB', badge: 'Custom' },
  { name: 'SSC / RRB Photo', width: 200, height: 230, targetKb: 45, desc: '3.5 × 4.5 cm (20 KB - 50 KB)', badge: 'Most Popular' },
  { name: 'SSC / RRB Signature', width: 140, height: 60, targetKb: 18, desc: 'Scan Signature (10 KB - 20 KB)', badge: 'Official' },
  { name: 'UPSC / State PSC Photo', width: 350, height: 450, targetKb: 80, desc: 'Standard Form (50 KB - 100 KB)', badge: 'UPSC' },
  { name: 'Standard Passport', width: 413, height: 531, targetKb: 100, desc: '3.5 × 4.5 cm High-Res', badge: 'HD Spec' },
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

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      let quality = 0.92;
      let dataUrl = canvas.toDataURL(format, quality);

      if (targetMaxKb > 0 && format !== 'image/png') {
        let iterations = 0;
        let minQ = 0.05;
        let maxQ = 0.95;

        while (iterations < 7) {
          const approxKb = Math.round((dataUrl.length * (3 / 4)) / 1024);
          if (Math.abs(approxKb - targetMaxKb) <= 3 || iterations === 6) {
            break;
          }
          if (approxKb > targetMaxKb) {
            maxQ = quality;
            quality = (minQ + maxQ) / 2;
          } else {
            minQ = quality;
            quality = (minQ + maxQ) / 2;
          }
          dataUrl = canvas.toDataURL(format, quality);
          iterations++;
        }
      }

      setResizedPreview(dataUrl);
      const finalKb = Math.round((dataUrl.length * (3 / 4)) / 1024);
      setResizedKb(finalKb);
    };
    img.src = resizeImage;
  }, [resizeImage, targetWidth, targetHeight, targetMaxKb, format]);

  return (
    <main className="tool-screen-main">
      <style>{`
        .tool-screen-main {
          min-height: calc(100vh - 140px);
          background: radial-gradient(circle at 50% 0%, #f0f7ff 0%, #f8fafc 40%, #f1f5f9 100%);
          padding: 24px 16px 84px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tool-screen-container {
          max-width: 860px;
          margin: 0 auto;
        }

        /* Nav Bar */
        .back-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-back-tools {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #1e293b;
          padding: 8px 16px;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-back-tools:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #0044cc;
          transform: translateX(-2px);
        }
        .privacy-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          padding: 4px 12px;
          border-radius: 999px;
        }

        /* Tool Card */
        .tool-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 22px;
          padding: 30px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
          margin-bottom: 24px;
        }
        .tool-header-block {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 18px;
          margin-bottom: 24px;
        }
        .tool-header-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px -4px rgba(37, 99, 235, 0.3);
          flex-shrink: 0;
        }
        .tool-title {
          font-size: 1.5rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }
        .tool-desc {
          font-size: 0.92rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Upload Dropzone */
        .upload-dropzone {
          border: 2px dashed #93c5fd;
          background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
          border-radius: 18px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 20px;
        }
        .upload-dropzone:hover {
          border-color: #2563eb;
          background: #eff6ff;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.12);
        }
        .upload-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: #ffffff;
          color: #0044cc;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 4px 12px rgba(0, 68, 204, 0.12);
        }
        .upload-title {
          font-size: 1.12rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .upload-hint {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 14px;
        }
        .upload-btn-fake {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0044cc;
          color: #ffffff;
          font-size: 0.86rem;
          font-weight: 750;
          padding: 9px 20px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 68, 204, 0.25);
        }

        /* Active File Banner */
        .file-active-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 18px;
          margin-bottom: 22px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .file-info-text {
          font-size: 0.88rem;
          color: #334155;
          font-weight: 600;
        }
        .file-info-badge {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          margin-left: 6px;
        }
        .btn-change-file {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #1e293b;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-change-file:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        /* Presets Grid */
        .section-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.86rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .preset-btn {
          position: relative;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          border-radius: 14px;
          padding: 12px 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .preset-btn:hover {
          border-color: #93c5fd;
          background: #f8fafc;
          transform: translateY(-1px);
        }
        .preset-btn.active {
          border-color: #0044cc;
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
          box-shadow: 0 4px 14px rgba(0, 68, 204, 0.12);
        }
        .preset-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .preset-name {
          font-size: 0.9rem;
          font-weight: 800;
          color: #0f172a;
        }
        .preset-badge-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #0044cc;
          background: #dbeafe;
          padding: 1px 6px;
          border-radius: 999px;
        }
        .preset-desc {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.4;
        }

        /* Form Controls */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 18px;
        }
        .field-label {
          display: block;
          font-size: 0.84rem;
          font-weight: 750;
          color: #334155;
          margin-bottom: 6px;
        }
        .input-text, .select-box {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 11px;
          font-size: 0.92rem;
          color: #0f172a;
          background: #fff;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .input-text:focus, .select-box:focus {
          border-color: #0044cc;
          box-shadow: 0 0 0 3px rgba(0, 68, 204, 0.12);
        }
        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          font-weight: 650;
          color: #475569;
          cursor: pointer;
          margin-top: 8px;
          user-select: none;
        }
        .checkbox-label input {
          width: 16px;
          height: 16px;
          accent-color: #0044cc;
          cursor: pointer;
        }

        /* Preview Container */
        .preview-container {
          background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
          border: 1.5px solid #bfdbfe;
          border-radius: 18px;
          padding: 24px;
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .preview-header-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
          letter-spacing: 0.03em;
        }
        .preview-img-box {
          max-width: 280px;
          max-height: 280px;
          background: #ffffff;
          border: 2px solid #cbd5e1;
          border-radius: 14px;
          padding: 6px;
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }
        .preview-img-box img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          border-radius: 8px;
        }
        .preview-stats {
          display: flex;
          gap: 10px;
          font-size: 0.85rem;
          font-weight: 750;
          color: #1e293b;
          margin-bottom: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .stat-badge {
          background: #ffffff;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .stat-badge.highlight {
          background: #eff6ff;
          color: #0044cc;
          border-color: #bfdbfe;
        }

        /* Download Button */
        .btn-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #0044cc 0%, #2563eb 100%);
          color: #ffffff;
          font-size: 0.98rem;
          font-weight: 800;
          padding: 13px 32px;
          border-radius: 12px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 6px 20px rgba(0, 68, 204, 0.28);
        }
        .btn-download:hover {
          background: linear-gradient(135deg, #003399 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 68, 204, 0.35);
        }

        /* Guidelines Card */
        .exam-info-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border: 1.5px solid #a7f3d0;
          border-radius: 18px;
          padding: 20px;
          font-size: 0.86rem;
          color: #166534;
          line-height: 1.6;
        }
        .exam-info-card strong { color: #14532d; }

        @media (max-width: 640px) {
          .tool-card { padding: 20px 16px; border-radius: 18px; }
          .tool-title { font-size: 1.25rem; }
          .tool-header-icon { width: 44px; height: 44px; border-radius: 12px; }
          .form-row { grid-template-columns: 1fr; }
          .preset-grid { grid-template-columns: 1fr; }
          .btn-download { width: 100%; }
        }
      `}</style>

      <div className="tool-screen-container">
        {/* Navigation Bar */}
        <div className="back-nav-bar">
          <Link href="/tools" prefetch={true} className="btn-back-tools">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to All Tools</span>
          </Link>
          <span className="privacy-pill">
            <span>🔒</span> 100% Client-Side Privacy
          </span>
        </div>

        <div className="tool-card">
          <div className="tool-header-block">
            <div className="tool-header-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </div>
            <div>
              <h1 className="tool-title">Image Resize &amp; KB Compress</h1>
              <p className="tool-desc">
                Compress and scale photo (20–50 KB) &amp; signature (10–20 KB) to exact pixels for SSC, Railway &amp; UPSC exams.
              </p>
            </div>
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
              <div className="upload-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="upload-title">Upload Photo or Signature</div>
              <div className="upload-hint">Supports JPG, PNG, WEBP files up to 25 MB</div>
              <div className="upload-btn-fake">
                <span>Browse File</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="file-active-banner">
                <div className="file-info-text">
                  <span>Selected Image:</span>
                  <span className="file-info-badge">{origDimensions.w} × {origDimensions.h} px</span>
                  <span className="file-info-badge">{origDimensions.kb} KB</span>
                </div>
                <button
                  type="button"
                  onClick={() => resizeInputRef.current?.click()}
                  className="btn-change-file"
                >
                  Change Photo
                </button>
              </div>

              {/* Exam Presets */}
              <div className="section-label">
                <span>Select Exam Preset</span>
              </div>
              <div className="preset-grid">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className={`preset-btn${selectedPreset === p.name ? ' active' : ''}`}
                    onClick={() => handlePresetChange(p.name)}
                  >
                    <div className="preset-top">
                      <span className="preset-name">{p.name}</span>
                      {p.badge && <span className="preset-badge-tag">{p.badge}</span>}
                    </div>
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
                  <label className="field-label">Max Target File Size (KB)</label>
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
                    <span>Maintain original aspect ratio</span>
                  </label>
                </div>
                <div>
                  <label className="field-label">Target Output Format</label>
                  <select
                    className="select-box"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                  >
                    <option value="image/jpeg">JPEG / JPG (Standard for TCS iON &amp; Govt Portals)</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WEBP</option>
                  </select>
                </div>
              </div>

              {/* Result Preview & Download */}
              {resizedPreview && (
                <div className="preview-container">
                  <div className="preview-header-pill">
                    <span>✨</span> Form-Ready Output
                  </div>
                  <div className="preview-img-box">
                    <img src={resizedPreview} alt="Resized Result" />
                  </div>
                  <div className="preview-stats">
                    <div className="stat-badge">Dimensions: {targetWidth} × {targetHeight} px</div>
                    <div className="stat-badge highlight">File Size: ~{resizedKb} KB</div>
                    <div className="stat-badge">Format: {format.split('/')[1].toUpperCase()}</div>
                  </div>
                  <a
                    href={resizedPreview}
                    download={`${resizeFileName}_resized_${targetWidth}x${targetHeight}.${format.split('/')[1]}`}
                    className="btn-download"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download Form-Ready Photo</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Govt Exam Guidelines Notice */}
        <div className="exam-info-card">
          <strong>📌 Official Guidelines for SSC, Railway &amp; UPSC Application Forms:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 8, marginBottom: 0 }}>
            <li><strong>Photo Dimensions:</strong> Standard 3.5 cm width × 4.5 cm height (approx 200 × 230 pixels).</li>
            <li><strong>File Size:</strong> Photographs must be between <strong>20 KB and 50 KB</strong>. Signatures must be <strong>10 KB to 20 KB</strong>.</li>
            <li><strong>Format:</strong> JPEG/JPG format is strictly required by TCS iON / SSC application portals.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

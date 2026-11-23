'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function ImageBackgroundChangePage() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgFileName, setBgFileName] = useState<string>('photo');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [tolerance, setTolerance] = useState<number>(28);
  const [processedBgImage, setProcessedBgImage] = useState<string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!bgImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = img.width;
      const h = img.height;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const samplePoints = [
        0,
        (w - 1) * 4,
        Math.floor(w / 2) * 4,
        ((h - 1) * w) * 4,
        ((h - 1) * w + (w - 1)) * 4,
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

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distSq = (r - refR) ** 2 + (g - refG) ** 2 + (b - refB) ** 2;

        if (distSq < tolSq) {
          if (isTransparent) {
            data[i + 3] = 0;
          } else {
            const factor = Math.min(1, Math.sqrt(distSq / tolSq));
            data[i] = Math.round(targetR * (1 - factor) + r * factor);
            data[i + 1] = Math.round(targetG * (1 - factor) + g * factor);
            data[i + 2] = Math.round(targetB * (1 - factor) + b * factor);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessedBgImage(canvas.toDataURL('image/png'));
    };
    img.src = bgImage;
  }, [bgImage, bgColor, isTransparent, tolerance]);

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
        .field-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
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
          <span className="screen-badge">White / Custom BG</span>
        </div>

        <div className="tool-card">
          <div className="tool-header-block">
            <h1 className="tool-title">
              <span>🎨</span> Image Background Change
            </h1>
            <p className="tool-desc">
              Convert photo background to pure white or light sky blue to prevent government exam application form rejection.
            </p>
          </div>

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
                <button
                  type="button"
                  className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#ffffff' ? ' active' : ''}`}
                  style={{ backgroundColor: '#ffffff' }}
                  onClick={() => { setBgColor('#ffffff'); setIsTransparent(false); }}
                  title="Pure White (SSC / RRB Standard)"
                  aria-label="Pure White"
                />
                <button
                  type="button"
                  className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#dbeafe' ? ' active' : ''}`}
                  style={{ backgroundColor: '#dbeafe' }}
                  onClick={() => { setBgColor('#dbeafe'); setIsTransparent(false); }}
                  title="Light Sky Blue"
                  aria-label="Light Sky Blue"
                />
                <button
                  type="button"
                  className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#f1f5f9' ? ' active' : ''}`}
                  style={{ backgroundColor: '#f1f5f9' }}
                  onClick={() => { setBgColor('#f1f5f9'); setIsTransparent(false); }}
                  title="Light Grey"
                  aria-label="Light Grey"
                />
                <button
                  type="button"
                  className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#1e3a8a' ? ' active' : ''}`}
                  style={{ backgroundColor: '#1e3a8a' }}
                  onClick={() => { setBgColor('#1e3a8a'); setIsTransparent(false); }}
                  title="Deep Navy Blue"
                  aria-label="Deep Navy Blue"
                />
                <button
                  type="button"
                  className={`color-circle${!isTransparent && bgColor.toLowerCase() === '#ef4444' ? ' active' : ''}`}
                  style={{ backgroundColor: '#ef4444' }}
                  onClick={() => { setBgColor('#ef4444'); setIsTransparent(false); }}
                  title="Red Background"
                  aria-label="Red Background"
                />
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
                  aria-label="Transparent PNG"
                >
                  PNG
                </button>

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

              {/* Edge Tolerance */}
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

        {/* Govt Exam Guidelines Notice */}
        <div className="exam-info-card">
          <strong>📌 Official Guidelines for SSC, Railway &amp; UPSC Application Photos:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li><strong>Background:</strong> Must be plain white or very light color (dark/shadowy backgrounds cause rejection).</li>
            <li><strong>Face Coverage:</strong> At least 70-80% of photo area, looking directly into the camera with neutral expression. No hats, caps, or sunglasses.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

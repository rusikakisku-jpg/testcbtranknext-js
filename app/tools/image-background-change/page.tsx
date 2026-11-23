'use client';

import { useState, useRef, useEffect } from 'react';

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

  const COLOR_OPTIONS = [
    { name: 'Pure White (Official)', value: '#ffffff', border: '#cbd5e1' },
    { name: 'Sky Blue', value: '#dbeafe', border: '#93c5fd' },
    { name: 'Light Grey', value: '#f1f5f9', border: '#cbd5e1' },
    { name: 'Navy Blue', value: '#1e3a8a', border: '#1e3a8a' },
    { name: 'Red', value: '#ef4444', border: '#ef4444' },
  ];

  return (
    <main className="tool-screen-main">
      <style>{`
        .tool-screen-main {
          min-height: calc(100vh - 140px);
          background: #f8fafc;
          padding: 24px 16px 84px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
          overflow-x: hidden;
          width: 100%;
        }
        .tool-screen-container {
          max-width: 680px;
          margin: 0 auto;
          box-sizing: border-box;
          width: 100%;
        }

        /* Tool Card */
        .tool-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          box-sizing: border-box;
          width: 100%;
        }
        .tool-header-block {
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 16px;
          margin-bottom: 22px;
        }
        .tool-title {
          font-size: 1.35rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .tool-desc {
          font-size: 0.88rem;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
        }

        /* Upload Dropzone */
        .upload-dropzone {
          border: 2px dashed #cbd5e1;
          background: #f8fafc;
          border-radius: 16px;
          padding: 36px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
          width: 100%;
        }
        .upload-dropzone:hover {
          border-color: #7c3aed;
          background: #faf5ff;
        }
        .upload-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #ffffff;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
          border: 1px solid #e2e8f0;
        }
        .upload-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .upload-hint {
          font-size: 0.82rem;
          color: #64748b;
          margin-bottom: 14px;
        }
        .upload-btn-fake {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #7c3aed;
          color: #ffffff;
          font-size: 0.86rem;
          font-weight: 750;
          padding: 9px 20px;
          border-radius: 9px;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
        }

        /* Active File Header */
        .file-active-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 20px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .file-info-text {
          font-size: 0.84rem;
          color: #334155;
          font-weight: 700;
        }
        .btn-change-file {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #1e293b;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 750;
          cursor: pointer;
        }

        /* Color Options */
        .section-label {
          font-size: 0.82rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .color-palette {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 20px;
        }
        .color-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          padding: 5px 12px 5px 7px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.8rem;
          font-weight: 750;
          color: #334155;
        }
        .color-pill-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .color-pill-btn.active {
          border-color: #7c3aed;
          background: #f5f3ff;
          color: #6d28d9;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.15);
        }
        .swatch-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .custom-color-box {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 750;
          color: #334155;
          cursor: pointer;
        }

        /* Tolerance Control */
        .tolerance-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .tolerance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .tolerance-title {
          font-size: 0.82rem;
          font-weight: 750;
          color: #1e293b;
        }
        .tolerance-badge {
          font-size: 0.78rem;
          font-weight: 800;
          color: #7c3aed;
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          padding: 1px 8px;
          border-radius: 999px;
        }
        .slider-range {
          width: 100%;
          height: 6px;
          accent-color: #7c3aed;
          cursor: pointer;
        }
        .tolerance-hint {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: #64748b;
          margin-top: 4px;
        }

        /* Result Preview */
        .preview-container {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 16px;
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-sizing: border-box;
          width: 100%;
        }
        .preview-img-box {
          max-width: 240px;
          max-height: 240px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 14px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
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
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 750;
          color: #1e293b;
          margin-bottom: 16px;
        }
        .stat-badge {
          background: #ffffff;
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
        }
        .stat-badge.highlight {
          background: #f5f3ff;
          color: #7c3aed;
          border-color: #ddd6fe;
        }

        /* Download Button */
        .btn-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #7c3aed;
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 800;
          padding: 12px 28px;
          border-radius: 10px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
          box-sizing: border-box;
          min-height: 48px;
        }
        .btn-download:hover {
          background: #6d28d9;
        }

        @media (max-width: 640px) {
          .tool-screen-main { padding: 16px 12px 76px; }
          .tool-card { padding: 18px 14px; border-radius: 16px; }
          .tool-title { font-size: 1.2rem; }
          .color-palette { gap: 6px; }
          .color-pill-btn { padding: 4px 8px 4px 5px; font-size: 0.74rem; }
          .btn-download { width: 100%; }
        }
      `}</style>

      <div className="tool-screen-container">
        <div className="tool-card">
          <div className="tool-header-block">
            <h1 className="tool-title">Image Background Change</h1>
            <p className="tool-desc">
              Change background color to pure white or light sky blue for exam applications.
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
              <div className="upload-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <div className="upload-title">Upload Passport Photo</div>
              <div className="upload-hint">Upload photo to convert background to plain White or Custom Color</div>
              <div className="upload-btn-fake">
                <span>Browse Image</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="file-active-banner">
                <span className="file-info-text">Active Photo Loaded</span>
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  className="btn-change-file"
                >
                  Change Image
                </button>
              </div>

              {/* Target Background Color */}
              <div className="section-label">Select Background Color:</div>

              <div className="color-palette">
                {COLOR_OPTIONS.map((c) => {
                  const isActive = !isTransparent && bgColor.toLowerCase() === c.value.toLowerCase();
                  return (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-pill-btn${isActive ? ' active' : ''}`}
                      onClick={() => { setBgColor(c.value); setIsTransparent(false); }}
                    >
                      <span className="swatch-circle" style={{ backgroundColor: c.value, borderColor: c.border }}>
                        {isActive && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c.value === '#ffffff' ? '#0f172a' : '#ffffff'} strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}

                {/* Transparent PNG */}
                <button
                  type="button"
                  className={`color-pill-btn${isTransparent ? ' active' : ''}`}
                  onClick={() => setIsTransparent(true)}
                >
                  <span
                    className="swatch-circle"
                    style={{
                      background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 5px 5px',
                    }}
                  >
                    {isTransparent && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span>Transparent PNG</span>
                </button>

                {/* Custom Color */}
                <label className="custom-color-box">
                  <span>Custom:</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => { setBgColor(e.target.value); setIsTransparent(false); }}
                    style={{ width: 22, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{bgColor.toUpperCase()}</span>
                </label>
              </div>

              {/* Edge Tolerance */}
              <div className="tolerance-box">
                <div className="tolerance-header">
                  <span className="tolerance-title">Edge Sensitivity</span>
                  <span className="tolerance-badge">{tolerance}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="65"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="slider-range"
                />
                <div className="tolerance-hint">
                  <span>Sharp (5)</span>
                  <span>Balanced (28)</span>
                  <span>Aggressive (65)</span>
                </div>
              </div>

              {/* Background Result Preview */}
              {processedBgImage && (
                <div className="preview-container">
                  <div
                    className="preview-img-box"
                    style={{
                      background: isTransparent
                        ? 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'
                        : bgColor,
                    }}
                  >
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
      </div>
    </main>
  );
}

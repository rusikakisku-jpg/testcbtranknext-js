'use client';

import { useState, useRef, useEffect } from 'react';

interface ResizePreset {
  name: string;
  width: number;
  height: number;
  targetKb?: number;
  badge?: string;
  desc: string;
}

const PRESETS: ResizePreset[] = [
  { name: 'Custom', width: 0, height: 0, desc: 'Set your own width, height & KB', badge: 'Custom' },
  { name: 'SSC / RRB Photo', width: 200, height: 230, targetKb: 45, desc: '3.5 × 4.5 cm (20 KB - 50 KB)', badge: 'Official' },
  { name: 'SSC / RRB Signature', width: 140, height: 60, targetKb: 18, desc: 'Scan Signature (10 KB - 20 KB)', badge: 'Official' },
  { name: 'UPSC Photo', width: 350, height: 450, targetKb: 80, desc: 'Standard Portal (50 KB - 100 KB)', badge: 'UPSC' },
  { name: 'Standard Passport', width: 413, height: 531, targetKb: 100, desc: '3.5 × 4.5 cm (High-Res)', badge: 'HD' },
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
          transition: max-width 0.25s ease;
        }
        .tool-screen-container.has-image {
          max-width: 980px;
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
          border-color: #0044cc;
          background: #f0f7ff;
        }
        .upload-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #ffffff;
          color: #0044cc;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          box-shadow: 0 2px 8px rgba(0, 68, 204, 0.1);
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
          background: #0044cc;
          color: #ffffff;
          font-size: 0.86rem;
          font-weight: 750;
          padding: 9px 20px;
          border-radius: 9px;
          box-shadow: 0 2px 8px rgba(0, 68, 204, 0.2);
        }

        /* 2-Column Side-by-Side Grid on Desktop */
        .editor-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (min-width: 769px) {
          .editor-grid {
            grid-template-columns: 360px 1fr;
            gap: 28px;
          }
          .editor-left-col {
            position: sticky;
            top: 86px;
          }
        }

        /* Left Column (Uploaded Image & Live Output) */
        .editor-left-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .preview-card-box {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-sizing: border-box;
          width: 100%;
        }
        .preview-img-frame {
          max-width: 100%;
          max-height: 250px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 14px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-img-frame img {
          max-width: 100%;
          max-height: 240px;
          object-fit: contain;
          display: block;
          border-radius: 8px;
        }
        .preview-stats-bar {
          display: flex;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 750;
          color: #1e293b;
          margin-bottom: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .stat-badge {
          background: #ffffff;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
        }
        .stat-badge.highlight {
          background: #eff6ff;
          color: #0044cc;
          border-color: #bfdbfe;
        }

        /* Active File Bar */
        .file-info-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          gap: 8px;
          flex-wrap: wrap;
          box-sizing: border-box;
          width: 100%;
        }
        .file-info-text {
          font-size: 0.82rem;
          color: #334155;
          font-weight: 650;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .file-info-badge {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 5px;
          font-size: 0.76rem;
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
        .btn-change-file:hover {
          background: #f1f5f9;
        }

        /* Right Column (Controls / Editor) */
        .editor-right-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .section-label {
          font-size: 0.82rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }
        .preset-btn {
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          border-radius: 12px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          box-sizing: border-box;
          width: 100%;
        }
        .preset-btn:hover {
          border-color: #93c5fd;
          background: #f8fafc;
        }
        .preset-btn.active {
          border-color: #0044cc;
          background: #eff6ff;
          box-shadow: 0 2px 8px rgba(0, 68, 204, 0.1);
        }
        .preset-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .preset-name {
          font-size: 0.86rem;
          font-weight: 800;
          color: #0f172a;
        }
        .preset-badge-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #0044cc;
          background: #dbeafe;
          padding: 1px 6px;
          border-radius: 999px;
        }
        .preset-desc {
          font-size: 0.74rem;
          color: #64748b;
          line-height: 1.35;
        }

        /* Inputs */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .field-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 750;
          color: #334155;
          margin-bottom: 4px;
        }
        .input-text, .select-box {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 16px;
          color: #0f172a;
          background: #fff;
          outline: none;
          box-sizing: border-box;
        }
        .input-text:focus, .select-box:focus {
          border-color: #0044cc;
        }
        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 650;
          color: #475569;
          cursor: pointer;
          margin-top: 6px;
        }
        .checkbox-label input {
          width: 16px;
          height: 16px;
          accent-color: #0044cc;
        }

        /* Download Button */
        .btn-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #0044cc;
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 800;
          padding: 12px 20px;
          border-radius: 10px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 68, 204, 0.25);
          box-sizing: border-box;
          width: 100%;
          min-height: 48px;
        }
        .btn-download:hover {
          background: #003399;
        }

        @media (max-width: 768px) {
          .tool-screen-main { padding: 16px 12px 76px; }
          .tool-card { padding: 18px 14px; border-radius: 16px; }
          .tool-title { font-size: 1.2rem; }
          .form-row { grid-template-columns: 1fr; }
          .preset-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className={`tool-screen-container${resizeImage ? ' has-image' : ''}`}>
        <div className="tool-card">
          <div className="tool-header-block">
            <h1 className="tool-title">Image Resize &amp; KB Compress</h1>
            <p className="tool-desc">
              Scale photo (20–50 KB) &amp; signature (10–20 KB) to exact required pixels and size.
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
              <div className="upload-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="upload-title">Upload Photo or Signature</div>
              <div className="upload-hint">Supports JPG, PNG, WEBP files up to 25 MB</div>
              <div className="upload-btn-fake">
                <span>Browse Image</span>
              </div>
            </div>
          ) : (
            <div className="editor-grid">
              {/* Left Column: Image Preview, Live Stats & Download Button */}
              <div className="editor-left-col">
                <div className="preview-card-box">
                  <div className="preview-img-frame">
                    <img src={resizedPreview || resizeImage} alt="Preview Result" />
                  </div>
                  <div className="preview-stats-bar">
                    <div className="stat-badge">{targetWidth} × {targetHeight} px</div>
                    <div className="stat-badge highlight">Size: ~{resizedKb} KB</div>
                    <div className="stat-badge">{format.split('/')[1].toUpperCase()}</div>
                  </div>

                  {resizedPreview && (
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
                  )}
                </div>

                <div className="file-info-bar">
                  <div className="file-info-text">
                    <span>Original:</span>
                    <span className="file-info-badge">{origDimensions.w} × {origDimensions.h} px</span>
                    <span className="file-info-badge">{origDimensions.kb} KB</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => resizeInputRef.current?.click()}
                    className="btn-change-file"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Right Column: Editor Controls */}
              <div className="editor-right-col">
                {/* Exam Presets */}
                <div>
                  <div className="section-label">Select Preset:</div>
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
                </div>

                {/* Dimension Inputs */}
                <div className="form-row">
                  <div>
                    <label className="field-label">Target Width (px)</label>
                    <input
                      type="number"
                      className="input-text"
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="field-label">Target Height (px)</label>
                    <input
                      type="number"
                      className="input-text"
                      value={targetHeight}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Target KB & Format */}
                <div className="form-row">
                  <div>
                    <label className="field-label">Target Max Size (KB)</label>
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
                      <span>Lock aspect ratio</span>
                    </label>
                  </div>
                  <div>
                    <label className="field-label">Output Format</label>
                    <select
                      className="select-box"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                    >
                      <option value="image/jpeg">JPEG / JPG (Standard Exam Format)</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WEBP</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

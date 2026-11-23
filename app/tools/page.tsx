'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type ToolTab = 'resize' | 'background' | 'typing';

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

const TYPING_PASSAGES = [
  {
    title: 'SSC Pattern: Economic & Governance',
    text: 'The economic transformation of India over the past few decades has been driven by rapid digital adoption, manufacturing initiatives, and infrastructure modernization. Government competitive examinations have expanded access for youth across diverse states and regional backgrounds. Digital public infrastructure such as unified payments and online governance platforms have accelerated financial inclusion in rural and urban areas alike. As India continues to integrate with the global economy, educational institutions and public sector organizations are prioritizing digital literacy, administrative efficiency, and transparency in public service delivery. Aspirants preparing for national recruitment tests must cultivate steady speed, analytical precision, and consistent discipline to meet administrative standards.'
  },
  {
    title: 'Railway Pattern: Transport & Development',
    text: 'Indian Railways represents one of the largest and most complex transport networks in the world, connecting thousands of stations and carrying millions of passengers daily. The recent introduction of modern train sets, station redevelopment programs, and advanced signaling technology has significantly improved travel safety and passenger convenience. Dedicated freight corridors have revolutionized cargo movement across industrial hubs, reducing logistics costs and supporting national economic growth. Dedicated staff and technical professionals play an indispensable role in maintaining track safety and scheduling efficiency across all operating divisions.'
  },
  {
    title: 'General English: Science & Innovation',
    text: 'Scientific research and technological innovation are fundamental pillars of modern human progress. The transition towards renewable energy such as solar power, wind generation, and electric transport is reducing environmental degradation while creating sustainable employment opportunities worldwide. Clean water conservation, forest protection, and efficient municipal waste management ensure that natural resources remain viable for future generations. Dedicated young professionals with strong analytical thinking and technical capabilities are essential for driving scientific achievements.'
  }
];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>('resize');
  const toolSectionRef = useRef<HTMLDivElement>(null);

  // Switch tab and smooth scroll to tool on mobile
  const handleSelectTool = (tab: ToolTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        toolSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

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
  const bgInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // Tool 3: Typing Test State
  // ==========================================
  const [selectedPassageIndex, setSelectedPassageIndex] = useState<number>(0);
  const [testDuration, setTestDuration] = useState<number>(60); // 60s, 120s, 300s, 600s, 900s
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [keystrokes, setKeystrokes] = useState<number>(0);
  const [backspaces, setBackspaces] = useState<number>(0);
  const typingInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);

  const currentPassageWords = TYPING_PASSAGES[selectedPassageIndex].text.trim().split(/\s+/);

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

  // ------------------------------------------
  // Typing Test Handlers & Timer
  // ------------------------------------------
  const startTypingTest = () => {
    setIsTestActive(true);
    setIsTestFinished(false);
    setTimeLeft(testDuration);
    setUserInput('');
    setTypedWords([]);
    setKeystrokes(0);
    setBackspaces(0);
    setTimeout(() => {
      typingInputRef.current?.focus();
    }, 50);
  };

  const resetTypingTest = (newDuration?: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const dur = newDuration !== undefined ? newDuration : testDuration;
    setIsTestActive(false);
    setIsTestFinished(false);
    setTimeLeft(dur);
    setUserInput('');
    setTypedWords([]);
    setKeystrokes(0);
    setBackspaces(0);
  };

  // Timer countdown
  useEffect(() => {
    if (isTestActive && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTestActive(false);
            setIsTestFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTestActive, timeLeft]);

  // Handle typing key events
  const handleTypingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isTestFinished) return;

    if (!isTestActive) {
      setIsTestActive(true);
    }

    if (e.key === 'Backspace') {
      setBackspaces((b) => b + 1);
    }

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = userInput.trim();
      if (trimmed.length > 0) {
        setTypedWords((prev) => [...prev, trimmed]);
        setUserInput('');

        // If completed last word
        if (typedWords.length + 1 >= currentPassageWords.length) {
          setIsTestActive(false);
          setIsTestFinished(true);
        }
      }
    } else if (e.key.length === 1) {
      setKeystrokes((k) => k + 1);
    }
  };

  // Live Stats
  const elapsedSeconds = testDuration - timeLeft;
  const elapsedMinutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0.01;

  let correctChars = 0;
  let wrongChars = 0;
  let correctWordsCount = 0;

  typedWords.forEach((typed, i) => {
    const target = currentPassageWords[i] || '';
    if (typed === target) {
      correctChars += target.length + 1; // +1 for space
      correctWordsCount += 1;
    } else {
      wrongChars += Math.max(typed.length, target.length);
    }
  });

  const grossWpm = Math.round((keystrokes / 5) / (elapsedMinutes || 0.01));
  const netWpm = Math.max(0, Math.round((correctChars / 5) / (elapsedMinutes || 0.01)));
  const accuracy = typedWords.length > 0 ? Math.round((correctWordsCount / typedWords.length) * 100) : 100;

  // Format timer mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

        /* Mobile-First Tools Directory List View */
        .tools-list-view {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 28px;
        }
        .tool-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
        }
        .tool-list-item:hover {
          border-color: #93c5fd;
          background: #f8fafc;
          transform: translateY(-1px);
        }
        .tool-list-item.active {
          border-color: #0066ff;
          background: #eff6ff;
          box-shadow: 0 4px 14px rgba(0, 102, 255, 0.12);
        }
        .tool-list-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
        }
        .tool-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          flex-shrink: 0;
        }
        .tool-icon-resize { background: #dbeafe; color: #1d4ed8; }
        .tool-icon-bg { background: #fae8ff; color: #a21caf; }
        .tool-icon-typing { background: #dcfce7; color: #15803d; }
        .tool-item-info {
          flex: 1;
        }
        .tool-item-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 3px;
        }
        .tool-item-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .tool-item-badge {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 999px;
          background: #e2e8f0;
          color: #475569;
          letter-spacing: 0.03em;
        }
        .tool-list-item.active .tool-item-badge {
          background: #0066ff;
          color: #ffffff;
        }
        .tool-item-desc {
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.35;
          margin: 0;
        }
        .tool-arrow-icon {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-left: 10px;
          transition: transform 0.2s;
        }
        .tool-list-item.active .tool-arrow-icon {
          color: #0066ff;
          transform: translateX(3px);
        }

        .tool-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          margin-bottom: 24px;
        }
        @media (max-width: 600px) {
          .tool-card { padding: 18px 14px; }
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
          .form-row { grid-template-columns: 1fr; }
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

        /* Typing Test Styles */
        .typing-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 18px;
        }
        .typing-timer-badge {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0066ff;
          background: #eff6ff;
          border: 1.5px solid #bfdbfe;
          padding: 6px 16px;
          border-radius: 10px;
          font-variant-numeric: tabular-nums;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .typing-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .typing-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .typing-stat-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          text-align: center;
        }
        .typing-stat-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }
        .typing-stat-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .passage-box {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          padding: 18px;
          font-size: 1.05rem;
          line-height: 1.8;
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 18px;
          user-select: none;
          font-family: inherit;
        }
        .passage-word {
          display: inline-block;
          margin-right: 6px;
          border-radius: 4px;
          padding: 1px 3px;
        }
        .passage-word.correct { color: #16a34a; font-weight: 600; }
        .passage-word.incorrect { color: #dc2626; text-decoration: line-through; background: #fee2e2; }
        .passage-word.active { background: #dbeafe; color: #1d4ed8; font-weight: 700; outline: 2px solid #3b82f6; }
        .passage-word.pending { color: #64748b; }

        .typing-input-box {
          position: relative;
          margin-bottom: 16px;
        }
        .typing-input {
          width: 100%;
          padding: 14px 18px;
          font-size: 1.15rem;
          border: 2px solid #0066ff;
          border-radius: 12px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.15);
        }
        .typing-input:disabled {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #94a3b8;
        }

        .scorecard-result-box {
          background: #eff6ff;
          border: 2px solid #bfdbfe;
          border-radius: 14px;
          padding: 24px;
          text-align: center;
          margin-top: 16px;
        }
        .scorecard-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #1e3a8a;
          margin-bottom: 6px;
        }
        .qualification-badge {
          display: inline-block;
          font-size: 0.85rem;
          font-weight: 800;
          padding: 6px 16px;
          border-radius: 999px;
          margin: 10px 0 16px;
        }
        .qualification-badge.pass { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .qualification-badge.fail { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

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

      <div className="tools-container">
        {/* Header */}
        <header className="tools-header">
          <h1 className="tools-title">Aspirant &amp; Student Tools</h1>
          <p className="tools-subtitle">
            Free utility suite for SSC, Railway, UPSC &amp; Govt exam forms: Photo Resize, Background Change &amp; Speed Test.
          </p>
        </header>

        {/* ========================================================= */}
        {/* Mobile-First Tools Directory List View */}
        {/* ========================================================= */}
        <div className="tools-list-view" role="tablist" aria-label="Available Tools">
          {/* 1. Image Resize Item */}
          <button
            type="button"
            className={`tool-list-item${activeTab === 'resize' ? ' active' : ''}`}
            onClick={() => handleSelectTool('resize')}
            role="tab"
            aria-selected={activeTab === 'resize'}
          >
            <div className="tool-list-left">
              <div className="tool-icon-circle tool-icon-resize">📐</div>
              <div className="tool-item-info">
                <div className="tool-item-title-row">
                  <span className="tool-item-title">Image Resize &amp; KB Compress</span>
                  <span className="tool-item-badge">Photo &amp; Sign</span>
                </div>
                <p className="tool-item-desc">
                  Resize photo (20-50 KB) and signature (10-20 KB) to exact pixels for SSC, RRB &amp; UPSC.
                </p>
              </div>
            </div>
            <div className="tool-arrow-icon">❯</div>
          </button>

          {/* 2. Image Background Change Item */}
          <button
            type="button"
            className={`tool-list-item${activeTab === 'background' ? ' active' : ''}`}
            onClick={() => handleSelectTool('background')}
            role="tab"
            aria-selected={activeTab === 'background'}
          >
            <div className="tool-list-left">
              <div className="tool-icon-circle tool-icon-bg">🎨</div>
              <div className="tool-item-info">
                <div className="tool-item-title-row">
                  <span className="tool-item-title">Image Background Change</span>
                  <span className="tool-item-badge">White / Blue BG</span>
                </div>
                <p className="tool-item-desc">
                  Convert photo background to pure white or light sky blue per official exam notification rules.
                </p>
              </div>
            </div>
            <div className="tool-arrow-icon">❯</div>
          </button>

          {/* 3. Typing Speed Test Item */}
          <button
            type="button"
            className={`tool-list-item${activeTab === 'typing' ? ' active' : ''}`}
            onClick={() => handleSelectTool('typing')}
            role="tab"
            aria-selected={activeTab === 'typing'}
          >
            <div className="tool-list-left">
              <div className="tool-icon-circle tool-icon-typing">⌨️</div>
              <div className="tool-item-info">
                <div className="tool-item-title-row">
                  <span className="tool-item-title">Exam Typing Speed Test</span>
                  <span className="tool-item-badge">SSC &amp; Railway</span>
                </div>
                <p className="tool-item-desc">
                  Practice typing test with real-time Gross WPM, Net WPM, Accuracy % and Key Depressions countdown.
                </p>
              </div>
            </div>
            <div className="tool-arrow-icon">❯</div>
          </button>
        </div>

        {/* Selected Tool Details Container */}
        <div ref={toolSectionRef}>
          {/* ========================================================= */}
          {/* TOOL 1: Image Resize & Compress */}
          {/* ========================================================= */}
          {activeTab === 'resize' && (
            <div className="tool-card">
              <div style={{ marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  📐 Image Resize &amp; KB Compress
                </h2>
                <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                  Adjust exact dimensions (pixels) and compress to target KB without losing clarity.
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
          {/* TOOL 2: Image Background Change */}
          {/* ========================================================= */}
          {activeTab === 'background' && (
            <div className="tool-card">
              <div style={{ marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  🎨 Image Background Change
                </h2>
                <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                  Convert photo background to pure white or custom color to prevent exam application rejection.
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

          {/* ========================================================= */}
          {/* TOOL 3: Exam Typing Speed Test */}
          {/* ========================================================= */}
          {activeTab === 'typing' && (
            <div className="tool-card">
              <div style={{ marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  ⌨️ Exam Typing Speed Test
                </h2>
                <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                  Practice TCS iON / SSC / Railway exam pattern typing test with countdown timer and error analysis.
                </p>
              </div>

              {/* Controls Bar: Timer Duration & Passage Selector */}
              <div className="typing-controls-bar">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Duration:</label>
                  {[
                    { label: '1 Min', val: 60 },
                    { label: '2 Min', val: 120 },
                    { label: '5 Min', val: 300 },
                    { label: '10 Min (RRB)', val: 600 },
                    { label: '15 Min (SSC)', val: 900 }
                  ].map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => { setTestDuration(d.val); resetTypingTest(d.val); }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid',
                        borderColor: testDuration === d.val ? '#0066ff' : '#cbd5e1',
                        background: testDuration === d.val ? '#eff6ff' : '#ffffff',
                        color: testDuration === d.val ? '#0066ff' : '#475569',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div className="typing-timer-badge">
                  ⏱️ {formatTimer(timeLeft)}
                </div>
              </div>

              {/* Passage Select */}
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Select Practice Passage Pattern:</label>
                <select
                  className="select-box"
                  value={selectedPassageIndex}
                  disabled={isTestActive}
                  onChange={(e) => {
                    setSelectedPassageIndex(Number(e.target.value));
                    resetTypingTest();
                  }}
                >
                  {TYPING_PASSAGES.map((p, idx) => (
                    <option key={idx} value={idx}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Live Stats Grid */}
              <div className="typing-stats-grid">
                <div className="typing-stat-box">
                  <div className="typing-stat-val" style={{ color: '#0066ff' }}>{netWpm}</div>
                  <div className="typing-stat-label">Net WPM</div>
                </div>
                <div className="typing-stat-box">
                  <div className="typing-stat-val">{grossWpm}</div>
                  <div className="typing-stat-label">Gross WPM</div>
                </div>
                <div className="typing-stat-box">
                  <div className="typing-stat-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>
                    {accuracy}%
                  </div>
                  <div className="typing-stat-label">Accuracy</div>
                </div>
                <div className="typing-stat-box">
                  <div className="typing-stat-val">{keystrokes}</div>
                  <div className="typing-stat-label">Key Depressions</div>
                </div>
              </div>

              {/* Passage Paragraph Display */}
              <div className="passage-box" onClick={() => typingInputRef.current?.focus()}>
                {currentPassageWords.map((word, idx) => {
                  let statusClass = 'pending';
                  if (idx < typedWords.length) {
                    statusClass = typedWords[idx] === word ? 'correct' : 'incorrect';
                  } else if (idx === typedWords.length) {
                    statusClass = 'active';
                  }

                  return (
                    <span key={idx} className={`passage-word ${statusClass}`}>
                      {word}
                    </span>
                  );
                })}
              </div>

              {/* Typing Input */}
              <div className="typing-input-box">
                <input
                  ref={typingInputRef}
                  type="text"
                  className="typing-input"
                  placeholder={isTestActive ? "Type here and press Space..." : "Click here to start typing (Timer will begin automatically)..."}
                  value={userInput}
                  disabled={isTestFinished}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleTypingKeyDown}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontWeight: 700 }}>Space</kbd> after each word to proceed.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => resetTypingTest()}
                    style={{
                      background: '#f1f5f9',
                      border: '1.5px solid #cbd5e1',
                      color: '#475569',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Restart Test
                  </button>
                  {!isTestActive && !isTestFinished && (
                    <button
                      type="button"
                      onClick={startTypingTest}
                      style={{
                        background: '#0066ff',
                        border: 'none',
                        color: '#ffffff',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ▶️ Start Test
                    </button>
                  )}
                </div>
              </div>

              {/* Result Scorecard when finished */}
              {isTestFinished && (
                <div className="scorecard-result-box">
                  <div className="scorecard-title">🎉 Test Complete! Your Scorecard</div>

                  <div>
                    {netWpm >= 35 ? (
                      <span className="qualification-badge pass">
                        ✅ Qualified for SSC CGL / CHSL (≥ 35 WPM) &amp; RRB NTPC (≥ 30 WPM)
                      </span>
                    ) : netWpm >= 30 ? (
                      <span className="qualification-badge pass">
                        ✅ Qualified for RRB NTPC (≥ 30 WPM) | SSC CHSL (Target: 35 WPM)
                      </span>
                    ) : (
                      <span className="qualification-badge fail">
                        ⚠️ Needs More Speed Practice (Target: 35 WPM English / 30 WPM Hindi)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                    <div style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0066ff' }}>{netWpm} WPM</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>NET TYPING SPEED</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{grossWpm} WPM</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>GROSS SPEED</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>{accuracy}%</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACCURACY</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{keystrokes}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>KEY DEPRESSIONS</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => resetTypingTest()}
                    className="btn-download"
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    🔁 Practice Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Govt Exam Guidelines Notice */}
        <div className="exam-info-card">
          <strong>📌 Official Guidelines for SSC, Railway &amp; Govt Competitive Exams:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li><strong>Photo Specifications:</strong> Must have plain white or light background, 20 KB to 50 KB file size, 3.5 × 4.5 cm dimensions.</li>
            <li><strong>Signature Specifications:</strong> 10 KB to 20 KB, clear on white paper with black/blue ink.</li>
            <li><strong>Typing Speed Criteria:</strong> SSC CHSL/CGL requires <strong>35 WPM</strong> in English (approx 1750 key depressions in 10 mins) or <strong>30 WPM</strong> in Hindi. RRB NTPC requires <strong>30 WPM</strong> in English or <strong>25 WPM</strong> in Hindi.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

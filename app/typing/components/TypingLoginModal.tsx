'use client';

import { useState } from 'react';
import { TypingCandidate } from './TypingNavbar';

interface TypingLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (candidate: TypingCandidate) => void;
  initialCandidate: TypingCandidate | null;
}

const EXAM_OPTIONS = [
  'SSC CGL (Tier 2 DEST - 35 WPM)',
  'SSC CHSL (Tier 2 Typing - 35 WPM)',
  'RRB NTPC (Typing Skill Test - 30 WPM)',
  'High Court & Court Clerk (40 WPM)',
  'CISF / CRPF / ITBP Constable Typist (35 WPM)',
  'DSSSB & State PSC Typist (30 WPM)',
  'General Speed Improvement Practice',
];

export default function TypingLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialCandidate,
}: TypingLoginModalProps) {
  const [name, setName] = useState(initialCandidate?.name || '');
  const [rollNo, setRollNo] = useState(initialCandidate?.rollNo || '');
  const [targetExam, setTargetExam] = useState(initialCandidate?.targetExam || EXAM_OPTIONS[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter your name');
      return;
    }

    const candidate: TypingCandidate = {
      name: cleanName,
      rollNo: rollNo.trim() || undefined,
      targetExam,
      loggedInAt: Date.now(),
    };

    try {
      localStorage.setItem('cbt_typing_candidate', JSON.stringify(candidate));
    } catch {
      // LocalStorage fallback
    }

    onLoginSuccess(candidate);
    onClose();
  };

  const handleGuestContinue = () => {
    onClose();
  };

  return (
    <div className="typing-modal-overlay" onClick={onClose}>
      <div className="typing-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="typing-modal-header">
          <div className="typing-modal-title-group">
            <span className="typing-modal-icon">🎯</span>
            <div>
              <h2 className="typing-modal-title">Aspirant Profile &amp; Login</h2>
              <p className="typing-modal-sub">
                Track your net speed, exam qualification status, and keystroke records.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="typing-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="typing-modal-form">
          {error && <div className="typing-modal-error">{error}</div>}

          <div className="typing-form-group">
            <label className="typing-form-label">
              Full Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              required
              className="typing-form-input"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
          </div>

          <div className="typing-form-group">
            <label className="typing-form-label">
              Target Govt Exam <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              className="typing-form-select"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
            >
              {EXAM_OPTIONS.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          <div className="typing-form-group">
            <label className="typing-form-label">
              Roll No. / Registration ID <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>(Optional)</span>
            </label>
            <input
              type="text"
              className="typing-form-input"
              placeholder="e.g. 2201018899"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </div>

          <div className="typing-modal-actions">
            <button type="submit" className="typing-btn-primary">
              💾 Save Profile &amp; Start Practice
            </button>
            <button
              type="button"
              onClick={handleGuestContinue}
              className="typing-btn-secondary"
            >
              Continue as Guest (No Login)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

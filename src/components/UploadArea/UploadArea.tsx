import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, ShieldCheck } from 'lucide-react';
import { MESSAGES } from '../../constants/messages';
import { EDITOR_CONFIG } from '../../constants/config';
import './UploadArea.css';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  onTrySample: () => void;
  isLoading: boolean;
  loadingMessage?: string;
  errorMessage?: string | null;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileSelect,
  onTrySample,
  isLoading,
  loadingMessage,
  errorMessage,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(EDITOR_CONFIG.upload.acceptedExtension)) {
      alert(MESSAGES.upload.invalidTypeError);
      return;
    }
    const maxBytes = EDITOR_CONFIG.upload.maxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(MESSAGES.upload.maxSizeWarning);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="upload-container">
        <div className="upload-card">
          <div className="loading-container">
            <div className="spinner" />
            <p className="loading-text">{loadingMessage || 'Processing PDF...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-container">
      <div className="upload-card">
        <div className="upload-logo">
          <FileText size={32} />
        </div>

        <h1 className="upload-title">{MESSAGES.upload.title}</h1>
        <p className="upload-subtitle">{MESSAGES.upload.subtitle}</p>

        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--accent-danger)',
              color: '#fca5a5',
              fontSize: '0.9rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        <div
          className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={EDITOR_CONFIG.upload.acceptedExtension}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          <UploadCloud size={44} className="drop-icon" />
          <p className="drop-text">Drag & Drop PDF file here</p>
          <span className="drop-subtext">Supports PDF up to {EDITOR_CONFIG.upload.maxFileSizeMb}MB</span>
        </div>

        <div className="upload-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={18} />
            {MESSAGES.upload.browseButton}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onTrySample}
          >
            <Sparkles size={18} />
            {MESSAGES.upload.trySampleButton}
          </button>
        </div>

        <div className="upload-privacy">
          <ShieldCheck size={16} className="privacy-badge" />
          <span>{MESSAGES.upload.privacyNote}</span>
        </div>
      </div>
    </div>
  );
};

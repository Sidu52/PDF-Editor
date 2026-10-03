import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import './AlertBanner.css';

interface AlertBannerProps {
  type: 'warning' | 'error';
  title?: string;
  message: string;
  onClose: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  title,
  message,
  onClose,
}) => {
  return (
    <div className={`alert-banner alert-${type}`}>
      <div className="alert-content">
        {type === 'warning' ? (
          <AlertTriangle size={18} />
        ) : (
          <AlertCircle size={18} />
        )}
        <div>
          {title && <strong>{title}: </strong>}
          <span>{message}</span>
        </div>
      </div>
      <button
        type="button"
        className="alert-close-btn"
        onClick={onClose}
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

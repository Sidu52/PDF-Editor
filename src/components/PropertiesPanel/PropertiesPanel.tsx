import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Sliders,
  RotateCw,
  Copy,
  Layers,
  X,
} from 'lucide-react';
import type { TextObject } from '../../types/pdf';
import {
  SUPPORTED_FONT_FAMILIES,
  MIN_FONT_SIZE_PT,
  MAX_FONT_SIZE_PT,
} from '../../constants/fonts';
import { PRESET_TEXT_COLORS } from '../../constants/colors';
import { MESSAGES } from '../../constants/messages';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  selectedText: TextObject | null;
  selectedObjects: TextObject[];
  isOpen?: boolean;
  onClose?: () => void;
  onUpdateText: (updated: Partial<TextObject> & { id: string }, description?: string) => void;
  onUpdateMultipleProperties: (props: Partial<TextObject>, description?: string) => void;
  onDeleteSelected: () => void;
  onCopySelected: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedText,
  selectedObjects,
  isOpen = false,
  onClose,
  onUpdateText,
  onUpdateMultipleProperties,
  onDeleteSelected,
  onCopySelected,
}) => {
  if (selectedObjects.length === 0 || !selectedText) {
    return (
      <aside className={`properties-panel ${isOpen ? 'open' : ''}`}>
        <div className="properties-header">
          <span className="properties-title">{MESSAGES.properties.title}</span>
          {onClose && (
            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="empty-state">
          <Sliders size={36} className="empty-state-icon" />
          <p className="empty-state-text">{MESSAGES.properties.noSelection}</p>
        </div>
      </aside>
    );
  }

  const isMulti = selectedObjects.length > 1;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateText(
      { id: selectedText.id, text: e.target.value },
      'Edit text content'
    );
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isMulti) {
      onUpdateMultipleProperties({ fontFamily: e.target.value }, 'Change font family');
    } else {
      onUpdateText({ id: selectedText.id, fontFamily: e.target.value }, 'Change font family');
    }
  };

  const handleFontSizeChange = (newSize: number) => {
    const clamped = Math.max(MIN_FONT_SIZE_PT, Math.min(MAX_FONT_SIZE_PT, newSize));
    if (isMulti) {
      onUpdateMultipleProperties({ fontSize: clamped }, 'Change font size');
    } else {
      const topOfBox = selectedText.y + selectedText.height;
      const scaleFactor = clamped / (selectedText.fontSize || clamped);
      const newHeight = Math.max(clamped * 1.2, Math.round(selectedText.height * scaleFactor * 10) / 10);
      const newWidth = Math.max(selectedText.width, Math.round(selectedText.width * scaleFactor * 10) / 10);
      const newY = Math.round((topOfBox - newHeight) * 10) / 10;

      onUpdateText(
        {
          id: selectedText.id,
          fontSize: clamped,
          height: newHeight,
          width: newWidth,
          y: newY,
        },
        'Change font size'
      );
    }
  };

  const handleColorChange = (colorHex: string) => {
    if (isMulti) {
      onUpdateMultipleProperties({ color: colorHex }, 'Change text color');
    } else {
      onUpdateText({ id: selectedText.id, color: colorHex }, 'Change text color');
    }
  };

  const toggleBold = () => {
    const nextVal = !selectedText.bold;
    if (isMulti) {
      onUpdateMultipleProperties({ bold: nextVal }, 'Toggle bold');
    } else {
      onUpdateText({ id: selectedText.id, bold: nextVal }, 'Toggle bold');
    }
  };

  const toggleItalic = () => {
    const nextVal = !selectedText.italic;
    if (isMulti) {
      onUpdateMultipleProperties({ italic: nextVal }, 'Toggle italic');
    } else {
      onUpdateText({ id: selectedText.id, italic: nextVal }, 'Toggle italic');
    }
  };

  const toggleUnderline = () => {
    const nextVal = !selectedText.underline;
    if (isMulti) {
      onUpdateMultipleProperties({ underline: nextVal }, 'Toggle underline');
    } else {
      onUpdateText({ id: selectedText.id, underline: nextVal }, 'Toggle underline');
    }
  };

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    if (isMulti) {
      onUpdateMultipleProperties({ alignment: align }, 'Change alignment');
    } else {
      onUpdateText({ id: selectedText.id, alignment: align }, 'Change alignment');
    }
  };

  const handleRotationChange = (degreesVal: number) => {
    const clamped = (Math.round(degreesVal) % 360 + 360) % 360;
    if (isMulti) {
      onUpdateMultipleProperties({ rotation: clamped }, 'Change rotation');
    } else {
      onUpdateText({ id: selectedText.id, rotation: clamped }, 'Change rotation');
    }
  };

  const handleXChange = (val: number) => {
    onUpdateText({ id: selectedText.id, x: Math.max(0, val) }, 'Change X position');
  };

  const handleYChange = (val: number) => {
    onUpdateText({ id: selectedText.id, y: Math.max(0, val) }, 'Change Y position');
  };

  const handleWidthChange = (val: number) => {
    onUpdateText({ id: selectedText.id, width: Math.max(40, val) }, 'Change width');
  };

  const handleHeightChange = (val: number) => {
    onUpdateText({ id: selectedText.id, height: Math.max(18, val) }, 'Change height');
  };

  return (
    <aside className={`properties-panel ${isOpen ? 'open' : ''}`}>
      <div className="properties-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="properties-title">
            {isMulti ? MESSAGES.properties.multiSelectionTitle : MESSAGES.properties.title}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isMulti ? `(${selectedObjects.length})` : `P${selectedText.pageNumber}`}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="properties-body">
        {/* Multi-Selection Banner */}
        {isMulti && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.75rem',
              background: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: '#93c5fd',
            }}
          >
            <Layers size={16} />
            <span>Editing {selectedObjects.length} selected elements together</span>
          </div>
        )}

        {/* Content Section (single select only) */}
        {!isMulti && (
          <div className="prop-section">
            <label className="prop-label">{MESSAGES.properties.contentLabel}</label>
            <textarea
              className="prop-textarea"
              value={selectedText.text}
              onChange={handleTextChange}
              placeholder="Type text here..."
              rows={3}
            />
          </div>
        )}

        {/* Font Family Section */}
        <div className="prop-section">
          <label className="prop-label">{MESSAGES.properties.fontLabel}</label>
          <select
            className="prop-select"
            value={selectedText.fontFamily}
            onChange={handleFontChange}
          >
            {SUPPORTED_FONT_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size Section */}
        <div className="prop-section">
          <label className="prop-label">{MESSAGES.properties.sizeLabel} (pt)</label>
          <div className="size-controls">
            <input
              type="range"
              min={MIN_FONT_SIZE_PT}
              max={MAX_FONT_SIZE_PT}
              value={selectedText.fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
              className="prop-slider"
            />
            <input
              type="number"
              min={MIN_FONT_SIZE_PT}
              max={MAX_FONT_SIZE_PT}
              value={selectedText.fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10) || 12)}
              className="prop-input-number"
            />
          </div>
        </div>

        {/* Typography: Bold, Italic, Underline & Alignment */}
        <div className="prop-section">
          <label className="prop-label">Typography & Alignment</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="btn-group" style={{ flex: 1.2 }}>
              <button
                type="button"
                className={`btn-toggle ${selectedText.bold ? 'active' : ''}`}
                onClick={toggleBold}
                title="Bold (B)"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                className={`btn-toggle ${selectedText.italic ? 'active' : ''}`}
                onClick={toggleItalic}
                title="Italic (I)"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                className={`btn-toggle ${selectedText.underline ? 'active' : ''}`}
                onClick={toggleUnderline}
                title="Underline (U)"
              >
                <Underline size={16} />
              </button>
            </div>

            <div className="btn-group" style={{ flex: 1.2 }}>
              <button
                type="button"
                className={`btn-toggle ${selectedText.alignment === 'left' ? 'active' : ''}`}
                onClick={() => setAlignment('left')}
                title="Align Left"
              >
                <AlignLeft size={16} />
              </button>
              <button
                type="button"
                className={`btn-toggle ${selectedText.alignment === 'center' ? 'active' : ''}`}
                onClick={() => setAlignment('center')}
                title="Align Center"
              >
                <AlignCenter size={16} />
              </button>
              <button
                type="button"
                className={`btn-toggle ${selectedText.alignment === 'right' ? 'active' : ''}`}
                onClick={() => setAlignment('right')}
                title="Align Right"
              >
                <AlignRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Text Rotation Section */}
        <div className="prop-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="prop-label">{MESSAGES.properties.rotationLabel}</label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {selectedText.rotation || 0}°
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="btn-group" style={{ flex: 1 }}>
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  className={`btn-toggle ${(selectedText.rotation || 0) === deg ? 'active' : ''}`}
                  onClick={() => handleRotationChange(deg)}
                  title={`Rotate ${deg}°`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {deg}°
                </button>
              ))}
            </div>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => handleRotationChange(((selectedText.rotation || 0) + 90) % 360)}
              title="Rotate +90°"
              style={{ border: '1px solid var(--border-subtle)', height: '36px' }}
            >
              <RotateCw size={15} />
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            step={15}
            value={selectedText.rotation || 0}
            onChange={(e) => handleRotationChange(parseInt(e.target.value, 10))}
            className="prop-slider"
          />
        </div>

        {/* Color Picker */}
        <div className="prop-section">
          <label className="prop-label">{MESSAGES.properties.colorLabel}</label>
          <div className="color-swatches">
            {PRESET_TEXT_COLORS.map((c) => (
              <div
                key={c.hex}
                className={`color-swatch ${selectedText.color.toUpperCase() === c.hex.toUpperCase() ? 'active' : ''}`}
                style={{ backgroundColor: c.hex }}
                onClick={() => handleColorChange(c.hex)}
                title={c.name}
              />
            ))}
          </div>
          <div className="color-custom-row">
            <input
              type="color"
              className="color-picker-input"
              value={selectedText.color}
              onChange={(e) => handleColorChange(e.target.value)}
            />
            <input
              type="text"
              className="color-hex-text"
              value={selectedText.color}
              onChange={(e) => handleColorChange(e.target.value)}
            />
          </div>
        </div>

        {/* Dimensions & Position (for single selection) */}
        {!isMulti && (
          <>
            {/* Width & Height Dimensions */}
            <div className="prop-section">
              <label className="prop-label">{MESSAGES.properties.dimensionsLabel}</label>
              <div className="coordinates-grid">
                <div className="coord-field">
                  <span className="coord-label">W:</span>
                  <input
                    type="number"
                    step={1}
                    min={40}
                    className="coord-input"
                    value={Math.round(selectedText.width)}
                    onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 40)}
                  />
                </div>
                <div className="coord-field">
                  <span className="coord-label">H:</span>
                  <input
                    type="number"
                    step={1}
                    min={18}
                    className="coord-input"
                    value={Math.round(selectedText.height)}
                    onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 18)}
                  />
                </div>
              </div>
            </div>

            {/* Position X / Y */}
            <div className="prop-section">
              <label className="prop-label">{MESSAGES.properties.positionLabel}</label>
              <div className="coordinates-grid">
                <div className="coord-field">
                  <span className="coord-label">X:</span>
                  <input
                    type="number"
                    step={1}
                    className="coord-input"
                    value={Math.round(selectedText.x)}
                    onChange={(e) => handleXChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="coord-field">
                  <span className="coord-label">Y:</span>
                  <input
                    type="number"
                    step={1}
                    className="coord-input"
                    value={Math.round(selectedText.y)}
                    onChange={(e) => handleYChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Copy Button */}
        <button
          type="button"
          className="toolbar-btn"
          onClick={onCopySelected}
          style={{
            border: '1px solid var(--border-subtle)',
            width: '100%',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          <Copy size={16} />
          <span>Copy {isMulti ? `${selectedObjects.length} Elements` : 'Element'} (Ctrl+C)</span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          className="btn-delete-prop"
          onClick={onDeleteSelected}
        >
          <Trash2 size={16} />
          <span>Delete {isMulti ? `${selectedObjects.length} Elements` : 'Text Element'}</span>
        </button>
      </div>
    </aside>
  );
};

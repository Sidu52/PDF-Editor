export const EDITOR_CONFIG = {
  // Zoom settings
  zoom: {
    min: 0.25,
    max: 3.0,
    step: 0.1,
    default: 1.0,
    presets: [
      { label: '50%', value: 0.5 },
      { label: '75%', value: 0.75 },
      { label: '100%', value: 1.0 },
      { label: '125%', value: 1.25 },
      { label: '150%', value: 1.5 },
      { label: '200%', value: 2.0 },
    ],
  },

  // Max history undo/redo states
  history: {
    maxRecords: 50,
  },

  // New text defaults
  newText: {
    defaultText: 'Double click to edit text',
    defaultFontSizePt: 14,
    defaultFontFamily: 'helvetica',
    defaultColor: '#000000',
    defaultAlignment: 'left' as const,
    defaultWidthPt: 180,
    defaultHeightPt: 24,
    dragSnapThresholdPx: 4,
    defaultRotationDegrees: 0,
    defaultUnderline: false,
  },

  // Resizing constraints
  resize: {
    minWidthPt: 40,
    minHeightPt: 18,
    handleSizePx: 8,
  },

  // Rotation controls
  rotation: {
    presets: [0, 90, 180, 270],
    minDegrees: 0,
    maxDegrees: 360,
    stepDegrees: 15,
  },

  // Clipboard settings
  clipboard: {
    pasteOffsetXPt: 15,
    pasteOffsetYPt: -15,
  },

  // PDF Page defaults and sizing
  page: {
    thumbnailWidthPx: 140,
    pageGapPx: 24,
    pointsPerInch: 72,
    defaultDpi: 96,
  },

  // UI Dimensions
  layout: {
    headerHeightPx: 56,
    toolbarHeightPx: 48,
    leftSidebarWidthPx: 220,
    rightSidebarWidthPx: 300,
  },

  // File constraints
  upload: {
    acceptedMimeTypes: ['application/pdf'],
    acceptedExtension: '.pdf',
    maxFileSizeMb: 50,
  },
} as const;

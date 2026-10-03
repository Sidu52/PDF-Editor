# PDF Forge - Production-Quality PDF Text Editor

A production-grade, client-side PDF text editor web application built with **React**, **TypeScript**, and **Vite**.

PDF Forge allows users to upload any standard PDF, view high-resolution rendered pages with thumbnails, interactively select existing text runs, edit text content, adjust typography and colors, drag-and-drop text to new positions, add new text, delete text, and download the modified PDF while preserving the original layout, vector graphics, and unaffected pages.

---

## Key Features

1. **Client-Side & Privacy-First**: 100% of processing happens in the user's browser using Web Workers and WebAssembly. Documents are never uploaded to any remote server.
2. **Existing Text Selection & In-Place Editing**:
   - Detects text runs and groups them into cohesive lines/words with accurate bounding boxes.
   - Click to select with a blue bounding box, drag handle, and real-time coordinate badge.
   - Double-click to edit inline or use the dedicated Properties Inspector.
3. **Typography & Styling Controls**:
   - Font Family (Helvetica/Arial, Times New Roman, Courier New, Georgia, Verdana).
   - Font Size (interactive slider and numeric input in PDF points).
   - Bold & Italic styling.
   - Text Alignment (Left, Center, Right).
   - Color picker with preset swatches and custom hex code input.
4. **Drag & Drop Text Positioning**:
   - Drag selected text freely across the page with mouse movement.
   - Bidirectional coordinate conversion between browser screen pixels and bottom-left PDF coordinate points (72 DPI standard).
   - Direct X / Y coordinate editing.
5. **Add & Delete Text**:
   - "Add Text" tool: click anywhere on the page to insert a new text element.
   - Delete tool or keyboard shortcut (`Del` / `Backspace`): removes text and applies a background-matched cover patch over the original text in the exported PDF.
6. **Undo / Redo History**:
   - Comprehensive action stack supporting `Ctrl+Z`, `Ctrl+Shift+Z`, and `Ctrl+Y`.
7. **Production-Grade PDF Export**:
   - Employs `pdf-lib` to preserve original PDF vector graphics, embedded images, and page structure.
   - Only modified, moved, deleted, or newly added text elements are processed. Unmodified text and graphics remain 100% untouched.
   - Robust character sanitization ensuring zero encoding crashes with Standard 14 PDF fonts.
8. **Sample Document Demonstration**:
   - One-click "Try Sample Document" button creates an in-memory 2-page invoice statement for instant testing.
9. **Scanned PDF Detection**:
   - Automatically detects image-only / scanned PDFs with zero selectable text runs and provides clear user guidance.

---

## Architecture & Design Principles

Adheres strictly to **Flow Zero Hardcoded Values** and **Strict Role Separation**:

```
src/
├── constants/             # Centralized configuration (Zero hardcoding)
│   ├── config.ts          # Zoom limits, presets, UI dimensions, upload limits
│   ├── fonts.ts           # Supported font families & standard font maps
│   ├── colors.ts          # Preset color palettes, theme tokens
│   └── messages.ts        # User-facing notices, tooltips, error strings
│
├── types/                 # TypeScript interfaces and domain models
│   ├── pdf.ts             # TextObject, PdfPageDimension, BoundingBox
│   ├── editor.ts          # PdfEditorState, HistoryRecord, ToolMode
│   └── fonts.ts           # FontFamilyOption, StandardFontKey
│
├── utils/                 # Pure mathematical & helper utilities
│   ├── coordinates.ts     # Screen-to-PDF & PDF-to-Screen coordinate math
│   ├── colors.ts          # Hex to normalized RGB (0..1) converters
│   └── file.ts            # File size formatting, browser download trigger
│
├── services/              # Pure business logic services (No React dependencies)
│   ├── pdfLoader.ts       # pdfjs-dist worker configuration & loader
│   ├── pdfTextExtractor.ts# Text run extraction, baseline clustering, bounds
│   ├── pdfExporter.ts     # pdf-lib redaction, font embedding, drawing, export
│   ├── fontManager.ts     # Web font to StandardFonts resolver
│   └── sampleDocument.ts  # Multi-page sample invoice generator
│
├── hooks/                 # React state & interaction hooks
│   ├── useHistory.ts      # Undo/Redo stack state machine
│   ├── useTextSelection.ts# Text selection & inline editing state
│   ├── useDraggableText.ts# Mouse drag calculation & PDF translation
│   └── usePdfEditor.ts    # Central hook coordinating editor lifecycle
│
├── components/            # Focused presentational and UI components
│   ├── UploadArea/        # Drag & drop upload screen
│   ├── PdfToolbar/        # Top action bar (zoom, modes, page stepper, export)
│   ├── PageThumbnails/    # Left sidebar live mini canvas previews
│   ├── PdfViewer/         # Central scrollable workspace
│   ├── PdfPage/           # DPR-scaled canvas rendering + TextOverlay
│   ├── TextOverlay/       # Interactive layer on top of PDF canvas
│   ├── TextItem/          # Individual text element, cover patch, drag handle
│   ├── PropertiesPanel/   # Right inspector for content, font, color, X/Y
│   └── AlertBanner/       # Warning & notification banners
│
├── tests/                 # Automated Vitest test suite
│   ├── coordinates.test.ts# Symmetry and clamping unit tests
│   ├── colors.test.ts     # Color parsing unit tests
│   └── pdfExporter.test.ts# End-to-end PDF export & reload integration tests
│
├── App.tsx                # Studio layout assembly
├── main.tsx               # Entry point
└── index.css              # Modern CSS tokens & typography
```

---

## Technical Rationale & PDF Editing Limitations

### Why PDF Editing Requires Layered Reconstruction
PDF is a display-oriented format, not a reflowable document format like HTML or DOCX. In a PDF:
- Characters and words are positioned using absolute glyph coordinates inside compressed content streams.
- Content streams do not store editable paragraphs; they store draw instructions (`Tj`, `TJ`, `cm`).
- To provide in-place editing without destroying existing vector graphics, forms, or raster images:
  1. `pdfjs-dist` extracts text positions, baseline matrices, and font sizes.
  2. The web application renders an interactive editing layer aligned with sub-pixel precision on top of each page.
  3. When an existing text run is modified, moved, or deleted, `pdf-lib` places a background-matched cover patch over the original text bounding box and draws the modified text at the new position using standard PDF fonts.
  4. Unchanged text runs and graphics are preserved verbatim.

---

## Getting Started

### Prerequisites
- Node.js >= 18.0.0 (tested on Node v22.14.0)
- npm >= 9.0.0

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Automated Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```
The compiled bundle will be output to the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## Keyboard Shortcuts
- `Ctrl + Z`: Undo last change
- `Ctrl + Shift + Z` / `Ctrl + Y`: Redo
- `Delete` / `Backspace`: Delete selected text element
- `V`: Switch to Select / Move tool
- `T`: Switch to Add Text tool

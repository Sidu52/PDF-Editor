import { X } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfPageDimension } from '../../types/pdf';
import './PageThumbnails.css';
import { useEffect, useRef } from 'react';

interface PageThumbnailsProps {
  pages: PdfPageDimension[];
  currentPage: number;
  pdfDoc: PDFDocumentProxy | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSelectPage: (pageNum: number) => void;
}

const ThumbnailItem: React.FC<{
  page: PdfPageDimension;
  isActive: boolean;
  pdfDoc: PDFDocumentProxy | null;
  onClick: () => void;
}> = ({ page, isActive, pdfDoc, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || renderedRef.current) return;

    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        const pageProxy = await pdfDoc.getPage(page.pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const targetWidth = 140;
        const scale = targetWidth / page.width;
        const viewport = pageProxy.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await pageProxy.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;

        renderedRef.current = true;
      } catch (err) {
        console.error('Thumbnail render error:', err);
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, page.pageNumber, page.width]);

  return (
    <div
      className={`thumbnail-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div
        className="thumbnail-preview-wrapper"
        style={{
          width: 140,
          height: Math.round(140 / page.aspectRatio),
        }}
      >
        <canvas ref={canvasRef} className="thumbnail-canvas" />
      </div>
      <span className="thumbnail-badge">Page {page.pageNumber}</span>
    </div>
  );
};

export const PageThumbnails: React.FC<PageThumbnailsProps> = ({
  pages,
  currentPage,
  pdfDoc,
  isOpen = false,
  onClose,
  onSelectPage,
}) => {
  return (
    <aside className={`page-thumbnails-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="thumbnails-header">
        <span>Pages ({pages.length})</span>
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
      <div className="thumbnails-list">
        {pages.map((p) => (
          <ThumbnailItem
            key={p.pageNumber}
            page={p}
            isActive={p.pageNumber === currentPage}
            pdfDoc={pdfDoc}
            onClick={() => {
              onSelectPage(p.pageNumber);
              if (onClose && window.innerWidth <= 1024) {
                onClose();
              }
            }}
          />
        ))}
      </div>
    </aside>
  );
};

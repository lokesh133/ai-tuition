'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, FileText, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface PdfWorksheetViewerProps {
  url: string;
  currentPage?: number;
  onTotalPagesChange?: (total: number) => void;
  zoom?: number;
  rotation?: number;
  isFitToHeight?: boolean;
  className?: string;
}

// Convert base64 data URL to Blob URL for clean browser loading
function toBlobUrl(rawUrl: string): string {
  if (typeof window === 'undefined') return rawUrl;
  if (!rawUrl.startsWith('data:application/pdf')) return rawUrl;

  try {
    const parts = rawUrl.split(';base64,');
    if (parts.length < 2) return rawUrl;
    const byteCharacters = window.atob(parts[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Failed to convert base64 to Blob URL:', err);
    return rawUrl;
  }
}

export const PdfWorksheetViewer: React.FC<PdfWorksheetViewerProps> = ({
  url,
  currentPage = 1,
  onTotalPagesChange,
  zoom = 1,
  rotation = 0,
  isFitToHeight = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);
  const [blobUrl, setBlobUrl] = useState<string>('');

  const renderTaskRef = useRef<any>(null);
  const pdfDocRef = useRef<any>(null);

  // Maintain blob URL lifecycle
  useEffect(() => {
    const createdBlobUrl = toBlobUrl(url);
    setBlobUrl(createdBlobUrl);

    return () => {
      if (createdBlobUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(createdBlobUrl);
        } catch {}
      }
    };
  }, [url]);

  // Load PDF.js library from local public/pdfjs/ folder or fallback to CDN
  const loadPdfJs = async (): Promise<any> => {
    if (typeof window === 'undefined') return null;
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

    return new Promise((resolve) => {
      const existing = document.getElementById('pdfjs-local-script') as HTMLScriptElement;
      if (existing) {
        if ((window as any).pdfjsLib) {
          resolve((window as any).pdfjsLib);
          return;
        }
        existing.addEventListener('load', () => {
          const lib = (window as any).pdfjsLib;
          if (lib) lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
          resolve(lib);
        });
        existing.addEventListener('error', () => resolve(null));
        return;
      }

      const script = document.createElement('script');
      script.id = 'pdfjs-local-script';
      script.src = '/pdfjs/pdf.min.js';
      script.async = true;

      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
        }
        resolve(lib);
      };

      script.onerror = () => {
        // Fallback to CDN if local fails
        const cdnScript = document.createElement('script');
        cdnScript.id = 'pdfjs-cdn-script';
        cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        cdnScript.onload = () => {
          const lib = (window as any).pdfjsLib;
          if (lib) {
            lib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          resolve(lib);
        };
        cdnScript.onerror = () => resolve(null);
        document.head.appendChild(cdnScript);
      };

      document.head.appendChild(script);
    });
  };

  // Render the current page onto the canvas
  const renderPdfPage = async () => {
    if (!blobUrl) return;

    try {
      setLoading(true);
      setError(null);

      const pdfjsLib = await loadPdfJs();
      if (!pdfjsLib) {
        console.warn('PDF.js unavailable, falling back to embedded iframe viewer');
        setUseIframeFallback(true);
        setLoading(false);
        return;
      }

      // Cancel any ongoing render task before starting a new one
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }

      // Load document if not already loaded or if URL changed
      let doc = pdfDocRef.current;
      if (!doc) {
        const loadingTask = pdfjsLib.getDocument({
          url: blobUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });
        doc = await loadingTask.promise;
        pdfDocRef.current = doc;
        if (onTotalPagesChange) {
          onTotalPagesChange(doc.numPages || 1);
        }
      }

      const safePage = Math.min(Math.max(1, currentPage), doc.numPages);
      const page = await doc.getPage(safePage);

      const canvas = canvasRef.current;
      if (!canvas) {
        setLoading(false);
        return;
      }

      // Determine viewport scale for crisp high-DPI rendering and optimal height fitting
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const baseViewport = page.getViewport({ scale: 1 });
      const container = containerRef.current;
      const cWidth = Math.max(240, (container?.clientWidth || 500) - 12);
      const cHeight = Math.max(200, (container?.clientHeight || 500) - 12);

      const scaleW = cWidth / baseViewport.width;
      const scaleH = cHeight / baseViewport.height;

      // When fitting to height/screen, fit inside both container height & width
      const baseFit = isFitToHeight ? Math.min(scaleW, scaleH) : scaleW;
      const effectiveZoom = Math.max(0.6, Math.min(3.5, baseFit * zoom));
      const renderScale = effectiveZoom * dpr;

      const viewport = page.getViewport({ scale: renderScale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${Math.round(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.round(viewport.height / dpr)}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        setUseIframeFallback(true);
        setLoading(false);
        return;
      }

      // Fill white background before drawing
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;
      setLoading(false);
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') {
        // Ignored normal cancellation
        return;
      }
      console.error('PDF Canvas Render Error:', err);
      // Fallback to iframe if canvas rendering fails
      setUseIframeFallback(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    pdfDocRef.current = null;
    setUseIframeFallback(false);
  }, [blobUrl]);

  useEffect(() => {
    renderPdfPage();

    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [blobUrl, currentPage, zoom, isFitToHeight]);

  if (useIframeFallback) {
    return (
      <div className={`relative w-full h-full flex flex-col items-center justify-center ${className}`}>
        <iframe
          src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full rounded-xl border border-slate-200 bg-white"
          title="Uploaded Worksheet PDF"
        />
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <a
            href={blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 bg-white/90 hover:bg-white text-blue-700 text-[10px] font-bold rounded-lg shadow-sm border border-blue-200 flex items-center gap-1 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            <span>PDF खोलें</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
    >
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-2xs gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-[11px] font-bold text-slate-600">
            PDF वर्कशीट लोड हो रही है...
          </span>
        </div>
      )}

      {error ? (
        <div className="p-4 text-center space-y-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
          <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
          <p className="text-xs font-bold">{error}</p>
          <button
            type="button"
            onClick={() => renderPdfPage()}
            className="px-3 py-1 bg-white text-rose-700 text-xs font-bold rounded-lg border border-rose-300 shadow-2xs hover:bg-rose-100 flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            <span>पुनः प्रयास करें</span>
          </button>
        </div>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center overflow-auto"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
          }}
        >
          <canvas
            ref={canvasRef}
            className={`rounded-xl shadow-xs border border-slate-200 bg-white block select-none ${
              isFitToHeight
                ? 'max-h-full max-w-full w-auto h-auto object-contain'
                : 'w-full h-auto object-contain'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default PdfWorksheetViewer;

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Edit3, Eraser, Trash2, X, Minimize2, Maximize2, Sparkles, GripVertical, Move } from 'lucide-react';

interface RoughWorkScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const RoughWorkScratchpad: React.FC<RoughWorkScratchpadProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [activeColor, setActiveColor] = useState<string>('#fde047'); // yellow chalk
  const [brushSize, setBrushSize] = useState<number>(3);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialLeft: number; initialTop: number }>({
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
  });

  // Handle Dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only drag from the header bar, avoid dragging if clicking buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = clientX - dragStartRef.current.startX;
      const deltaY = clientY - dragStartRef.current.startY;

      const newLeft = Math.max(10, Math.min(window.innerWidth - 320, dragStartRef.current.initialLeft + deltaX));
      const newTop = Math.max(10, Math.min(window.innerHeight - 100, dragStartRef.current.initialTop + deltaY));

      setPosition({ x: newLeft, y: newTop });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions based on display container
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen, isMinimized]);

  if (!isOpen) return null;

  // Drawing event handlers (Touch + Mouse for tablets & phones)
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (isEraser) {
      ctx.strokeStyle = isDarkMode ? '#0f172a' : '#1e293b'; // chalk green/slate bg
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div
      ref={containerRef}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: 'auto',
              right: 'auto',
            }
          : undefined
      }
      className={`fixed z-40 shadow-2xl rounded-3xl border overflow-hidden transition-shadow ${
        position
          ? ''
          : isMinimized
          ? 'bottom-20 right-4 w-64'
          : 'bottom-4 right-4 sm:right-6'
      } ${
        isMinimized
          ? 'w-64'
          : 'w-[92vw] sm:w-[420px] md:w-[480px] h-[340px] sm:h-[380px]'
      } ${
        isDarkMode
          ? 'bg-slate-900 border-amber-500/40 text-white shadow-amber-500/10'
          : 'bg-slate-900 border-slate-700 text-white shadow-2xl'
      } ${isDragging ? 'opacity-95 ring-2 ring-amber-400 select-none' : ''}`}
    >
      {/* Header bar - DRAGGABLE */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="bg-slate-950/95 px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        title="रफ़ कॉपी को खींचकर कहीं भी रखें (Drag anywhere)"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-lg">📝</span>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-black text-amber-300 leading-none">
                रफ़ कॉपी (Rough Workpad)
              </h4>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                ड्रैग करें ✥
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              अपनी गणना व गुणा-भाग यहाँ करके देखें
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title={isMinimized ? 'बड़ा करें' : 'छोटा करें'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="रफ़ कॉपी बंद करें"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-52px)]">
          {/* Chalkboard Canvas */}
          <div className="flex-1 relative bg-slate-950 cursor-crosshair touch-none">
            {/* Grid texture for math lined notebook */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full block"
            />
          </div>

          {/* Controls toolbar */}
          <div className="bg-slate-950/90 p-2.5 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5">
              {[
                { color: '#fde047', name: 'पीली चॉक' },
                { color: '#ffffff', name: 'सफेद चॉक' },
                { color: '#38bdf8', name: 'नीली चॉक' },
                { color: '#f472b6', name: 'गुलाबी चॉक' },
                { color: '#4ade80', name: 'हरी चॉक' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => {
                    setActiveColor(c.color);
                    setIsEraser(false);
                  }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    !isEraser && activeColor === c.color
                      ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900'
                      : 'hover:scale-110 opacity-75'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}

              <div className="h-4 w-px bg-white/20 mx-1" />

              {/* Eraser */}
              <button
                type="button"
                onClick={() => setIsEraser(!isEraser)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  isEraser
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
                title="मिटाने वाला (रबड़)"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">रबड़</span>
              </button>
            </div>

            {/* Clear All */}
            <button
              type="button"
              onClick={clearCanvas}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-300 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 transition-all flex items-center gap-1"
              title="पूरा रफ़ काम साफ करें"
            >
              <Trash2 className="w-3 h-3" />
              <span>साफ करें</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

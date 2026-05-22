'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  isPainter: boolean;
  onDraw?: (data: string) => void;
  initialData?: string;
}

export default function DrawingCanvas({ isPainter, onDraw, initialData }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const initialDataRef = useRef(initialData);
  const lineCountRef = useRef(0);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Only resize if dimensions actually changed to avoid unnecessary clearing
        if (canvas.width !== parent.clientWidth) {
          canvas.width = parent.clientWidth;
          canvas.height = 300;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#fff';
          
          // Re-draw if we have data after resize
          if (initialDataRef.current) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = initialDataRef.current;
          }
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (!isPainter && initialData) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = initialData;
      }
    } else if (!isPainter && !initialData) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [initialData, isPainter]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPainter) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    lastPos.current = pos;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isPainter) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;

    lineCountRef.current += 1;
    if (lineCountRef.current % 10 === 0 && onDraw) {
      onDraw(canvas.toDataURL('image/webp', 0.5));
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lineCountRef.current = 0;
    if (onDraw && canvasRef.current) {
      onDraw(canvasRef.current.toDataURL('image/webp', 0.5));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onDraw) onDraw('');
    }
  };

  return (
    <div className="relative w-full bg-gray-800 rounded-xl overflow-hidden border border-gray-700 h-[300px]">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className={`w-full h-full ${isPainter ? 'cursor-crosshair' : 'cursor-default'}`}
      />
      {isPainter && (
        <button
          onClick={clearCanvas}
          className="absolute top-2 right-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] font-bold px-2 py-1 rounded border border-red-500/30 transition-colors"
        >
          지우기
        </button>
      )}
    </div>
  );
}

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
  const pointBuffer = useRef<{ x: number, y: number }[]>([]);
  const initialDataRef = useRef(initialData);
  const requestRef = useRef<number | null>(null);
  const lastDrawTime = useRef<number>(0);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  const initContext = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        if (canvas.width !== parent.clientWidth) {
          canvas.width = parent.clientWidth;
          canvas.height = 300;
          initContext(ctx);
          
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
  }, [initContext]);

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
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
    return lastPos.current;
  };

  const renderFrame = useCallback(() => {
    if (!isDrawing || !isPainter) {
      requestRef.current = requestAnimationFrame(renderFrame);
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) {
      requestRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    if (pointBuffer.current.length > 0) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      
      for (const pos of pointBuffer.current) {
        ctx.lineTo(pos.x, pos.y);
        lastPos.current = pos;
      }
      ctx.stroke();
      pointBuffer.current = [];

      // Throttle onDraw call (approx 10 times per second)
      const now = Date.now();
      if (now - lastDrawTime.current > 100 && onDraw) {
        onDraw(canvas.toDataURL('image/webp', 0.5));
        lastDrawTime.current = now;
      }
    }

    requestRef.current = requestAnimationFrame(renderFrame);
  }, [isDrawing, isPainter, onDraw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [renderFrame]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPainter) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    lastPos.current = pos;
    pointBuffer.current = [pos];
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isPainter) return;
    pointBuffer.current.push(getMousePos(e));
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
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
        className={`w-full h-full ${isPainter ? 'cursor-crosshair' : 'cursor-default'} touch-none`}
      />
      {isPainter && (
        <button
          onClick={clearCanvas}
          type="button"
          className="absolute top-2 right-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] font-bold px-2 py-1 rounded border border-red-500/30 transition-colors"
        >
          지우기
        </button>
      )}
    </div>
  );
}


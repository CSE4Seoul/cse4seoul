'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  isPainter: boolean;
  onDraw?: (data: string) => void;
  initialData?: string;
}

const COLORS = [
  { name: '흰색', value: '#ffffff' },
  { name: '검정', value: '#000000' },
  { name: '빨강', value: '#ff4444' },
  { name: '초록', value: '#44ff44' },
  { name: '파랑', value: '#4444ff' },
  { name: '노랑', value: '#ffff44' },
  { name: '보라', value: '#ff44ff' },
  { name: '주황', value: '#ff8844' },
];

export default function DrawingCanvas({ isPainter, onDraw, initialData }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const lastPos = useRef({ x: 0, y: 0 });
  const initialDataLoaded = useRef(false);
  const lastSavedData = useRef<string>('');
  const lastSaveTime = useRef<number>(0);

  // 캔버스 컨텍스트 설정 초기화 및 유지
  const initContext = useCallback((ctx: CanvasRenderingContext2D, color: string) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
  }, []);

  // 초기 데이터 로드 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    if (!initialData || initialDataLoaded.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      initContext(ctx, currentColor);
      initialDataLoaded.current = true;
      lastSavedData.current = initialData;
    };
    img.src = initialData;
  }, [initialData, currentColor, initContext]);

  // 캔버스 크기 조절
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const newWidth = parent.clientWidth;
      const newHeight = 300;

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 기존 내용 백업
        const backup = canvas.toDataURL();
        canvas.width = newWidth;
        canvas.height = newHeight;

        // 컨텍스트 재설정
        initContext(ctx, currentColor);

        // 백업 복원
        if (backup && backup !== 'data:,') {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = backup;
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [currentColor, initContext]);

  // 뷰어 모드 실시간 동기화
  useEffect(() => {
    if (isPainter) return; // 그리는 사람은 동기화 무시
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    if (initialData && initialData !== lastSavedData.current) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        lastSavedData.current = initialData;
      };
      img.src = initialData;
    } else if (!initialData) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastSavedData.current = '';
    }
  }, [initialData, isPainter]);

  // 색상 변경 시 즉시 적용
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = currentColor;
    }
  }, [currentColor]);

  // 좌표 계산
  const getPointerPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  // 선 그리기
  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // 부모 컴포넌트에 데이터 전송 (Throttle)
    if (onDraw && canvas) {
      const now = Date.now();
      if (now - lastSaveTime.current > 100) {
        const dataUrl = canvas.toDataURL('image/webp', 0.5);
        if (dataUrl !== lastSavedData.current) {
          onDraw(dataUrl);
          lastSavedData.current = dataUrl;
          lastSaveTime.current = now;
        }
      }
    }
  };

  // 이벤트 핸들러를 네이티브 이벤트로 등록하여 더 확실하게 제어
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPainter) return;

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getPointerPos(e.clientX, e.clientY);
      lastPos.current = pos;
      setIsDrawing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      const currentPos = getPointerPos(e.clientX, e.clientY);
      drawLine(lastPos.current, currentPos);
      lastPos.current = currentPos;
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      
      if (onDraw && canvas) {
        const dataUrl = canvas.toDataURL('image/webp', 0.5);
        onDraw(dataUrl);
        lastSavedData.current = dataUrl;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const pos = getPointerPos(touch.clientX, touch.clientY);
        lastPos.current = pos;
        setIsDrawing(true);
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawing || e.touches.length === 0) return;
      const touch = e.touches[0];
      const currentPos = getPointerPos(touch.clientX, touch.clientY);
      drawLine(lastPos.current, currentPos);
      lastPos.current = currentPos;
      if (e.cancelable) e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleMouseUp);
    };
  }, [isPainter, isDrawing, onDraw]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastSavedData.current = '';
      if (onDraw) onDraw('');
    }
  };

  const changeColor = (color: string) => {
    setCurrentColor(color);
  };

  return (
    <div className="relative w-full bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-inner">
      <div className="relative h-[300px] w-full">
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${isPainter ? 'cursor-crosshair' : 'cursor-default'} touch-none`}
          style={{ display: 'block' }}
        />
      </div>

      {isPainter && (
        <div className="flex items-center justify-between p-3 bg-gray-900/90 border-t border-gray-700">
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => changeColor(color.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  currentColor === color.value
                    ? 'border-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                type="button"
              />
            ))}
          </div>
          <button
            onClick={clearCanvas}
            type="button"
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-lg border border-red-500/30 transition-all active:scale-95"
          >
            모두 지우기
          </button>
        </div>
      )}
    </div>
  );
}

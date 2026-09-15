'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface CosmicBackgroundProps {
  showGrid?: boolean;
  showOrbs?: boolean;
  showRadialGradient?: boolean;
  isFixed?: boolean;
  enableSparkles?: boolean;
  starSizeMultiplier?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isSparkle: boolean;
  twinkleSpeed: number;
  twinklePhase: number;
}

export default function CosmicBackground({
  showGrid = true,
  showOrbs = true,
  showRadialGradient = true,
  isFixed = true,
  enableSparkles = true,
  starSizeMultiplier = 1.0,
  className = '',
}: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const updateDimensions = () => {
      if (isFixed) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      } else {
        const parent = containerRef.current || canvas.parentElement;
        width = canvas.width = parent ? parent.clientWidth : window.innerWidth;
        height = canvas.height = parent ? parent.clientHeight : window.innerHeight;
      }
    };

    updateDimensions();

    const particles: Particle[] = [];
    // 화면 크기에 비례하여 파티클 개수 계산 (적당한 밀도 유지)
    const numParticles = Math.min(65, Math.max(25, Math.floor((width * height) / 24000)));

    for (let i = 0; i < numParticles; i++) {
      const isSparkle = enableSparkles && i % 5 === 0; // 5개 중 1개는 반짝이는 십자별 형태
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: (Math.random() * 1.5 + 0.8) * starSizeMultiplier,
        color:
          i % 3 === 0
            ? 'rgba(6, 182, 212, 0.7)' // Cyan
            : i % 3 === 1
            ? 'rgba(139, 92, 246, 0.7)' // Violet
            : 'rgba(236, 72, 153, 0.6)', // Pink
        isSparkle,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    let mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      if (isFixed) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      } else {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      updateDimensions();
    };
    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. 미세 사이버 그리드 (왜곡 없이 완벽한 정사각형 유지)
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 1;
        const gridSize = 48;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // 2. 파티클 및 성좌 연결선 그리기
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // 마우스 중력 반응
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            p.x += dx * 0.007;
            p.y += dy * 0.007;
          }
        }

        // 반짝임 알파 계산
        p.twinklePhase += p.twinkleSpeed;
        const twinkleAlpha = 0.5 + Math.sin(p.twinklePhase) * 0.4;

        ctx.save();
        ctx.globalAlpha = twinkleAlpha;

        if (p.isSparkle) {
          // 십자형 반짝이는 별빛 모양 (Sparkle Star)
          const armLen = p.radius * 2.8;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x - armLen, p.y);
          ctx.lineTo(p.x + armLen, p.y);
          ctx.moveTo(p.x, p.y - armLen);
          ctx.lineTo(p.x, p.y + armLen);
          ctx.stroke();

          // 별 중심부
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fill();
        } else {
          // 원형 은은한 별빛
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 5;
          ctx.shadowColor = p.color;
          ctx.fill();
        }
        ctx.restore();

        // 성좌 연결선
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.12;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [showGrid, isFixed, enableSparkles, starSizeMultiplier]);

  const containerPositionClass = isFixed ? 'fixed inset-0' : 'absolute inset-0';

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none ${containerPositionClass} z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* 1. Canvas 성좌/파티클 및 그리드 (1:1 픽셀 비율 매핑) */}
      <canvas ref={canvasRef} className="pointer-events-none block w-full h-full" />

      {/* 2. 상단 은은한 보랏빛 Radial Gradient */}
      {showRadialGradient && (
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.18),transparent_70%)]" />
      )}

      {/* 3. Framer Motion Glow Blur Orbs (찌그러짐 없이 원형 유지) */}
      {showOrbs && (
        <>
          <motion.div
            animate={{
              x: [0, 15, -15, 0],
              y: [0, -15, 15, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute left-[10%] top-[8%] z-0 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.035] blur-[140px]"
          />
          <motion.div
            animate={{
              x: [0, -20, 20, 0],
              y: [0, 20, -20, 0],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute right-[10%] top-[25%] z-0 h-[600px] w-[600px] rounded-full bg-violet-500/[0.035] blur-[160px]"
          />
        </>
      )}
    </div>
  );
}

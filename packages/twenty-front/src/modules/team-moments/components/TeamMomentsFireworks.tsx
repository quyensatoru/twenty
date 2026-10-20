import { styled } from '@linaria/react';
import { useEffect, useRef } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { RootStackingContextZIndices } from '@/ui/layout/constants/RootStackingContextZIndices';

const StyledCanvas = styled.canvas`
  height: 100%;
  inset: 0;
  pointer-events: none;
  position: fixed;
  width: 100%;
  z-index: ${RootStackingContextZIndices.RootModalBackDrop};

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

// oxlint-disable twenty/no-hardcoded-colors -- Firework artwork keeps its palette across themes.
const FIREWORK_COLORS = [
  '#F7A8C8',
  '#FFD27A',
  '#F76B15',
  '#8FB0F5',
  '#5FD3C0',
  '#FFFFFF',
];
// oxlint-enable twenty/no-hardcoded-colors
const SHOW_DURATION_MILLIS = 4200;
const BURST_INTERVAL_MILLIS = 420;
const SPARKS_PER_BURST = 46;
const GRAVITY = 0.045;
const DRAG = 0.985;

type Spark = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  color: string;
  size: number;
};

export const TeamMomentsFireworks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!isDefined(canvas) || !isDefined(context)) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.scale(pixelRatio, pixelRatio);

    const sparks: Spark[] = [];
    const startedAt = performance.now();
    let lastBurstAt = -BURST_INTERVAL_MILLIS;
    let animationFrame = 0;

    const burst = () => {
      const centerX = width * (0.15 + Math.random() * 0.7);
      const centerY = height * (0.12 + Math.random() * 0.4);
      const color =
        FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

      for (let index = 0; index < SPARKS_PER_BURST; index++) {
        const angle = (Math.PI * 2 * index) / SPARKS_PER_BURST;
        const speed = 2.2 + Math.random() * 2.6;

        sparks.push({
          x: centerX,
          y: centerY,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          life: 1,
          color:
            Math.random() < 0.3
              ? FIREWORK_COLORS[index % FIREWORK_COLORS.length]
              : color,
          size: 1.6 + Math.random() * 1.8,
        });
      }
    };

    const step = (now: number) => {
      const elapsed = now - startedAt;

      if (
        elapsed < SHOW_DURATION_MILLIS &&
        elapsed - lastBurstAt >= BURST_INTERVAL_MILLIS
      ) {
        burst();
        lastBurstAt = elapsed;
      }

      context.clearRect(0, 0, width, height);

      for (let index = sparks.length - 1; index >= 0; index--) {
        const spark = sparks[index];

        spark.velocityX *= DRAG;
        spark.velocityY = spark.velocityY * DRAG + GRAVITY;
        spark.x += spark.velocityX;
        spark.y += spark.velocityY;
        spark.life -= 0.012;

        if (spark.life <= 0) {
          sparks.splice(index, 1);
          continue;
        }

        context.globalAlpha = spark.life;
        context.fillStyle = spark.color;
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;

      if (elapsed < SHOW_DURATION_MILLIS || sparks.length > 0) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return <StyledCanvas ref={canvasRef} aria-hidden="true" />;
};

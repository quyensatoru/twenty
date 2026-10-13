import { type MouseEvent, useRef, useState } from 'react';

export const useTodaySurface = (isMotionEnabled: boolean, depth = 5) => {
  const [pointer, setPointer] = useState({ x: 50, y: 50, isInside: false });
  const lastFrame = useRef(0);
  const onMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (!isMotionEnabled || Date.now() - lastFrame.current < 50) return;
    const rectangle = event.currentTarget.getBoundingClientRect();
    if (rectangle.width === 0 || rectangle.height === 0) return;
    lastFrame.current = Date.now();
    setPointer({
      x: Math.max(
        0,
        Math.min(
          100,
          ((event.clientX - rectangle.left) / rectangle.width) * 100,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          100,
          ((event.clientY - rectangle.top) / rectangle.height) * 100,
        ),
      ),
      isInside: true,
    });
  };
  const isActive = isMotionEnabled && pointer.isInside;
  return {
    handlers: {
      onMouseMove,
      onMouseEnter: () => setPointer({ x: 50, y: 50, isInside: true }),
      onMouseLeave: () => setPointer({ x: 50, y: 50, isInside: false }),
      onFocus: () => setPointer({ x: 50, y: 50, isInside: true }),
      onBlur: () => setPointer({ x: 50, y: 50, isInside: false }),
    },
    isActive,
    transform: isActive
      ? `perspective(1000px) rotateX(${((50 - pointer.y) * depth) / 50}deg) rotateY(${((pointer.x - 50) * depth) / 50}deg) translate3d(0,-4px,0)`
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)',
    glow: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(120,113,108,${isActive ? '.035' : '0'}), transparent 72%)`,
    transition: isMotionEnabled
      ? 'transform 220ms ease-out, box-shadow 250ms ease, background 250ms ease'
      : 'none',
  };
};

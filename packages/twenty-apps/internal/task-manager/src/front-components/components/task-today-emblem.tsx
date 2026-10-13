import { useEffect, useState } from 'react';
import { IconCheck } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

type TaskTodayEmblemProps = {
  icon?: typeof IconCheck;
  color: string;
  isMotionEnabled: boolean;
  size?: number;
};

export const TaskTodayEmblem = ({
  icon: Icon = IconCheck,
  color,
  isMotionEnabled,
  size = 36,
}: TaskTodayEmblemProps) => {
  const [isTurned, setIsTurned] = useState(false);
  useEffect(() => {
    if (!isMotionEnabled) return;
    const interval = setInterval(
      () => setIsTurned((previous) => !previous),
      4200,
    );
    return () => clearInterval(interval);
  }, [isMotionEnabled]);
  const depth = size / 2;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size + 10,
        height: size + 10,
        position: 'relative',
        perspective: '350px',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 5,
          left: 5,
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
          transform:
            isMotionEnabled && isTurned
              ? 'translateY(-4px) rotateX(-14deg) rotateY(22deg) rotateZ(5deg)'
              : 'translateY(2px) rotateX(-22deg) rotateY(-22deg) rotateZ(-5deg)',
          transition: isMotionEnabled ? 'transform 4200ms ease-in-out' : 'none',
        }}
      >
        {[
          `translateZ(${depth}px)`,
          `rotateY(90deg) translateZ(${depth}px)`,
          `rotateX(90deg) translateZ(${depth}px)`,
          `rotateY(-90deg) translateZ(${depth}px)`,
          `rotateX(-90deg) translateZ(${depth}px)`,
          `rotateY(180deg) translateZ(${depth}px)`,
        ].map((transform, index) => (
          <span
            key={transform}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 7,
              border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
              color,
              background: `linear-gradient(135deg, color-mix(in srgb, ${TASK_TOKENS.background} ${index === 0 ? 92 : 78}%, ${color}), color-mix(in srgb, ${TASK_TOKENS.background} 82%, ${color}))`,
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,.35)',
              backfaceVisibility: 'hidden',
              transform,
            }}
          >
            {index === 0 && <Icon size={size * 0.48} />}
          </span>
        ))}
      </span>
    </span>
  );
};

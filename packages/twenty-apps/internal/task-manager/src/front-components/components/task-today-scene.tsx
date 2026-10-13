import { type CSSProperties, useEffect, useState } from 'react';
import { IconCheck, IconCheckbox } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

type TaskTodaySceneProps = { isMotionEnabled: boolean };

const GLASS_STYLE: CSSProperties = {
  position: 'absolute',
  background: `linear-gradient(140deg, color-mix(in srgb, ${TASK_TOKENS.background} 94%, #7dd3fc), color-mix(in srgb, ${TASK_TOKENS.background} 82%, #0284c7))`,
  border: '1px solid rgba(148,163,184,.4)',
  boxShadow:
    '0 14px 35px rgba(24,24,27,.12), inset 0 1px 0 rgba(255,255,255,.5)',
  borderRadius: 16,
};

export const TaskTodayScene = ({ isMotionEnabled }: TaskTodaySceneProps) => {
  const [isRaised, setIsRaised] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isMotionEnabled) return;
    // Only key poses cross the worker boundary; the host interpolates with CSS.
    const interval = setInterval(
      () => setIsRaised((previous) => !previous),
      3600,
    );
    return () => clearInterval(interval);
  }, [isMotionEnabled]);

  const isFloating = isMotionEnabled && isRaised;
  const transition = isMotionEnabled ? 'transform 3600ms ease-in-out' : 'none';
  const faceStyle: CSSProperties = {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 9,
    border: '1px solid rgba(255,255,255,.3)',
  };

  return (
    <div
      aria-hidden="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 360,
        height: 235,
        position: 'relative',
        flexShrink: 0,
        perspective: '850px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 12,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(24,24,27,.10), transparent 68%)',
          filter: 'blur(8px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform:
            isMotionEnabled && isHovered
              ? 'rotateY(-9deg) rotateX(4deg)'
              : 'rotateY(0deg) rotateX(0deg)',
          transition: isMotionEnabled
            ? 'transform 700ms cubic-bezier(.22,1,.36,1)'
            : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 62,
            top: 146,
            width: 238,
            height: 120,
            borderRadius: 30,
            border: '1px solid rgba(14,165,233,.2)',
            background:
              'linear-gradient(135deg, rgba(14,165,233,.12), rgba(56,189,248,.08))',
            transform: 'rotateX(65deg) rotateZ(-24deg)',
            boxShadow: '0 25px 45px rgba(24,24,27,.1)',
          }}
        />
        <div
          style={{
            ...GLASS_STYLE,
            left: 85,
            top: 49,
            width: 174,
            height: 118,
            padding: 16,
            transform: `translate3d(0,${isFloating ? -8 : 4}px,22px) rotateY(-17deg) rotateZ(-9deg)`,
            transition,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#0284c7',
              marginBottom: 15,
            }}
          >
            <IconCheckbox size={20} />
            <div
              style={{
                height: 7,
                width: 72,
                borderRadius: 6,
                background: 'rgba(14,165,233,.35)',
              }}
            />
          </div>
          {[100, 78, 55].map((width, index) => (
            <div
              key={width}
              style={{
                height: 6,
                width,
                borderRadius: 6,
                background: `rgba(14,165,233,${0.22 - index * 0.04})`,
                marginBottom: 10,
              }}
            />
          ))}
        </div>
        <div
          style={{
            ...GLASS_STYLE,
            left: 178,
            top: 122,
            width: 126,
            height: 62,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 13,
            transform: `translate3d(0,${isFloating ? 4 : -5}px,60px) rotateY(-17deg) rotateZ(-9deg)`,
            transition,
          }}
        >
          <span
            style={{
              color: '#059669',
              padding: 6,
              borderRadius: 10,
              background: 'rgba(16,185,129,.13)',
              display: 'flex',
            }}
          >
            <IconCheck size={20} />
          </span>
          <div>
            <div
              style={{
                width: 44,
                height: 6,
                background: 'rgba(14,165,233,.35)',
                borderRadius: 6,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                width: 30,
                height: 5,
                background: 'rgba(14,165,233,.2)',
                borderRadius: 6,
              }}
            />
          </div>
        </div>
        <div
          style={
            {
              position: 'absolute',
              left: 279,
              top: 31,
              width: 48,
              height: 48,
              borderRadius: '50%',
              cornerShape: 'round',
              background:
                'radial-gradient(circle at 30% 25%, #e0f2fe 0%, #7dd3fc 26%, #0284c7 60%, #0369a1 100%)',
              boxShadow:
                'inset -4px -6px 12px rgba(24,24,27,.22), 0 12px 24px rgba(99,102,241,.2)',
              transform: `translate3d(0,${isFloating ? 7 : -4}px,32px)`,
              transition,
            } as CSSProperties
          }
        />
        <div
          style={{
            position: 'absolute',
            left: 39,
            top: 135,
            width: 52,
            height: 52,
            transformStyle: 'preserve-3d',
            transform: `translateY(${isFloating ? -5 : 3}px) rotateX(-22deg) rotateY(35deg) rotateZ(-9deg)`,
            transition,
          }}
        >
          <div
            style={{
              ...faceStyle,
              transform: 'translateZ(26px)',
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <IconCheck size={25} />
          </div>
          <div
            style={{
              ...faceStyle,
              transform: 'rotateY(90deg) translateZ(26px)',
              background: '#3b82f6',
            }}
          />
          <div
            style={{
              ...faceStyle,
              transform: 'rotateX(90deg) translateZ(26px)',
              background: '#bfdbfe',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 50,
            top: 55,
            width: 13,
            height: 13,
            borderRadius: 4,
            background: 'linear-gradient(135deg,#a7f3d0,#34d399)',
            transform: `translateY(${isFloating ? 6 : -2}px) rotateZ(25deg)`,
            transition,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 314,
            top: 179,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: '#7dd3fc',
            transform: `translateY(${isFloating ? -4 : 3}px)`,
            transition,
          }}
        />
      </div>
    </div>
  );
};

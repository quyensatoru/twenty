import { useEffect, useState } from 'react';
import { IconCheck } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

type TaskTodayCelebrationProps = {
  message: string;
  isMotionEnabled: boolean;
  onDismiss: () => void;
};
const COLORS = ['#a8a29e', '#d6d3d1', '#9aafa0'];

export const TaskTodayCelebration = ({
  message,
  isMotionEnabled,
  onDismiss,
}: TaskTodayCelebrationProps) => {
  const [hasBurst, setHasBurst] = useState(false);
  useEffect(() => {
    const burst = setTimeout(() => setHasBurst(true), 40);
    const dismiss = setTimeout(onDismiss, 2800);
    return () => {
      clearTimeout(burst);
      clearTimeout(dismiss);
    };
  }, [onDismiss]);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {isMotionEnabled &&
        Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: '22%',
              width: index % 3 === 0 ? 10 : 6,
              height: index % 3 === 0 ? 10 : 14,
              borderRadius: index % 3 === 0 ? '50%' : 2,
              background: COLORS[index % COLORS.length],
              opacity: hasBurst ? 0 : 1,
              transform: hasBurst
                ? `translate3d(${Math.cos(index * 2.4) * (90 + index * 6)}px,${Math.sin(index * 2.4) * 150 + 250}px,0) rotate(${index * 65}deg)`
                : 'translate3d(0,0,0) rotate(0deg)',
              transition: `transform ${1600 + index * 20}ms cubic-bezier(.1,.7,.5,1), opacity 700ms ease 1000ms`,
            }}
          />
        ))}
      <div
        role="status"
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          maxWidth: 'calc(100% - 32px)',
          padding: '13px 20px',
          borderRadius: 14,
          color: TASK_TOKENS.textPrimary,
          background: TASK_TOKENS.background,
          border: `1px solid ${TASK_TOKENS.borderStrong}`,
          boxShadow: '0 12px 45px rgba(24,24,27,.1)',
          fontWeight: 600,
        }}
      >
        <IconCheck size={20} style={{ color: '#688674', flexShrink: 0 }} />
        {message}
      </div>
    </div>
  );
};

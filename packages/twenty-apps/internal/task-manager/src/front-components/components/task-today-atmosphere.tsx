import { type CSSProperties } from 'react';

export const TaskTodayAtmosphere = () => (
  <div
    aria-hidden="true"
    style={
      {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.18,
        backgroundImage:
          'radial-gradient(rgba(120,113,108,.22) .6px, transparent .6px)',
        backgroundSize: '6px 6px',
        maskImage: 'linear-gradient(transparent, black 35%, transparent)',
      } as CSSProperties
    }
  />
);

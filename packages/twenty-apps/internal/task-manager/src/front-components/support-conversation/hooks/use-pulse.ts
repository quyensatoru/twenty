import { useEffect, useState } from 'react';

const PULSE_INTERVAL_MS = 900;

// The sandbox cannot ship @keyframes, so a skeleton breathes by flipping a
// flag the style transitions between.
export const usePulse = (): boolean => {
  const [isDim, setIsDim] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => setIsDim((current) => !current),
      PULSE_INTERVAL_MS,
    );

    return () => clearInterval(interval);
  }, []);

  return isDim;
};

export const PULSE_TRANSITION = `opacity ${PULSE_INTERVAL_MS}ms ease-in-out`;

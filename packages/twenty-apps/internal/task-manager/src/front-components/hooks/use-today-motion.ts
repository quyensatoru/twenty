import { useEffect, useState } from 'react';

const MOTION_STORAGE_KEY = 'task-today.motion';

export const useTodayMotion = (
  memberId?: string | null,
  effectsEnabled?: boolean,
) => {
  const storageKey = memberId
    ? `${MOTION_STORAGE_KEY}:${memberId}`
    : MOTION_STORAGE_KEY;
  const [isMotionRequested, setIsMotionRequested] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== 'off';
    } catch {
      return true;
    }
  });
  const [hasEntered, setHasEntered] = useState(false);
  const isMotionEnabled = isMotionRequested;

  useEffect(() => {
    if (memberId) setIsMotionRequested(effectsEnabled !== false);
  }, [memberId, effectsEnabled]);

  useEffect(() => {
    const timeout = setTimeout(() => setHasEntered(true), 40);
    return () => clearTimeout(timeout);
  }, []);

  const toggleMotion = () => {
    const next = !isMotionRequested;
    setIsMotionRequested(next);
    try {
      localStorage.setItem(storageKey, next ? 'on' : 'off');
    } catch {
      // The preference still applies for this visit when storage is unavailable.
    }
  };

  const entranceStyle = (delay: number = 0) => ({
    opacity: !isMotionEnabled || hasEntered ? 1 : 0,
    transform:
      !isMotionEnabled || hasEntered ? 'translateY(0)' : 'translateY(12px)',
    transition: isMotionEnabled
      ? `opacity 480ms ease ${delay}ms, transform 480ms cubic-bezier(.22,1,.36,1) ${delay}ms`
      : 'none',
  });

  return { isMotionEnabled, toggleMotion, entranceStyle };
};

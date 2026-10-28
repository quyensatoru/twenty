import { useSyncExternalStore } from 'react';

// twenty-ui's MOBILE_VIEWPORT. The sandbox mirrors the host window's width and
// announces geometry changes on visualViewport; a width of 0 means not yet
// measured, read as desktop.
const MOBILE_VIEWPORT = 768;

const subscribeToViewport = (onChange: () => void) => {
  const viewport = window.visualViewport;

  viewport?.addEventListener('resize', onChange);
  viewport?.addEventListener('scroll', onChange);

  return () => {
    viewport?.removeEventListener('resize', onChange);
    viewport?.removeEventListener('scroll', onChange);
  };
};

const readIsMobile = () =>
  window.innerWidth > 0 && window.innerWidth <= MOBILE_VIEWPORT;

export const useIsMobile = (): boolean =>
  useSyncExternalStore(subscribeToViewport, readIsMobile);

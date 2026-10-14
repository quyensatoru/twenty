import { useEffect, useState } from 'react';

// False on the first paint and true right after, so an element can fade and
// rise in through a CSS transition instead of a keyframe animation.
export const useIsMountedVisible = (): boolean => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 16);

    return () => clearTimeout(timeout);
  }, []);

  return isVisible;
};

import { useEffect, useState } from 'react';

export const useNow = (intervalMillis = 1000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMillis);

    return () => clearInterval(timer);
  }, [intervalMillis]);

  return now;
};

import { type CSSProperties, type ReactNode } from 'react';

import { useIsMountedVisible } from '../hooks/use-is-mounted-visible';

type FadeInProps = {
  children: ReactNode;
  offset?: number;
  style?: CSSProperties;
};

export const FadeIn = ({ children, offset = 6, style }: FadeInProps) => {
  const isVisible = useIsMountedVisible();

  return (
    <div
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : `translateY(${offset}px)`,
        transition:
          'opacity 260ms ease-out, transform 320ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      {children}
    </div>
  );
};

import { type CSSProperties, type ReactNode } from 'react';
import { Card } from 'twenty-ui/primitives/surfaces';

import { PULSE_TRANSITION, usePulse } from '../hooks/use-pulse';
import { HEALTH_TOKENS, spacing } from './health-tokens';

type SkeletonBarProps = {
  width: number | string;
  height?: number;
  radius?: string;
  style?: CSSProperties;
};

export const SkeletonBar = ({
  width,
  height = 10,
  radius = HEALTH_TOKENS.radiusSmall,
  style,
}: SkeletonBarProps) => (
  <span
    style={{
      display: 'block',
      width,
      height,
      borderRadius: radius,
      background: HEALTH_TOKENS.backgroundTertiary,
      flexShrink: 0,
      ...style,
    }}
  />
);

// One pulse for the whole skeleton, so every placeholder breathes in step.
export const SkeletonPulse = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => {
  const isDim = usePulse();

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      style={{ opacity: isDim ? 0.55 : 1, transition: PULSE_TRANSITION }}
    >
      {children}
    </div>
  );
};

export const SkeletonCard = ({
  children,
  withHeader = true,
  style,
}: {
  children: ReactNode;
  withHeader?: boolean;
  style?: CSSProperties;
}) => (
  <Card.Root rounded fullWidth style={{ minWidth: 0, ...style }}>
    {withHeader && (
      <Card.Header>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(1.5),
            padding: `${spacing(0.5)} 0`,
          }}
        >
          <SkeletonBar width={140} height={12} />
          <SkeletonBar width={240} height={9} />
        </div>
      </Card.Header>
    )}
    <Card.Content>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing(3),
          width: '100%',
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </Card.Content>
  </Card.Root>
);

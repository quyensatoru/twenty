import { type CSSProperties, type ReactNode } from 'react';
import { Card } from 'twenty-ui/primitives/surfaces';

import { HEALTH_TOKENS, spacing } from './health-tokens';

type HealthCardProps = {
  title?: string;
  subtitle?: string;
  aside?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
};

export const HealthCard = ({
  title,
  subtitle,
  aside,
  children,
  style,
}: HealthCardProps) => (
  <Card.Root rounded fullWidth style={{ minWidth: 0, ...style }}>
    {(title !== undefined || aside !== undefined) && (
      <Card.Header>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: spacing(2),
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {title !== undefined && (
              <span style={{ fontWeight: HEALTH_TOKENS.fontWeightSemiBold }}>
                {title}
              </span>
            )}
            {subtitle !== undefined && (
              <span
                style={{
                  fontSize: HEALTH_TOKENS.fontSizeSm,
                  color: HEALTH_TOKENS.textTertiary,
                  fontWeight: 'normal',
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
          {aside}
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

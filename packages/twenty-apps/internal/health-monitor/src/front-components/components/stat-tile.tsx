import { Card } from 'twenty-ui/primitives/surfaces';

import { HEALTH_TOKENS, spacing } from './health-tokens';

type StatTileProps = {
  label: string;
  value: string;
  note?: string;
  valueColor?: string;
};

export const StatTile = ({ label, value, note, valueColor }: StatTileProps) => (
  <Card.Root rounded fullWidth style={{ minWidth: 0 }}>
    <Card.Content>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}
      >
        <span
          style={{
            fontSize: HEALTH_TOKENS.fontSizeSm,
            color: HEALTH_TOKENS.textSecondary,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: HEALTH_TOKENS.fontSizeXl,
            fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
            color: valueColor ?? HEALTH_TOKENS.textPrimary,
          }}
        >
          {value}
        </span>
        {note !== undefined && (
          <span
            style={{
              fontSize: HEALTH_TOKENS.fontSizeSm,
              color: HEALTH_TOKENS.textTertiary,
            }}
          >
            {note}
          </span>
        )}
      </div>
    </Card.Content>
  </Card.Root>
);

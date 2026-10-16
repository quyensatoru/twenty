import { Fragment, type ReactNode } from 'react';

import { INBOX_TOKENS } from './inbox-tokens';

export type PropertyRow = {
  key: string;
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  // A quieter second line under the value, e.g. "3 days ago" under a date.
  hint?: string;
};

// Label left, value right, one row per property inside a soft card, the way
// Intercom and Linear lay out a record's attributes: easier to scan than a
// grid of raw key/value text.
export const PropertyList = ({
  rows,
  variant = 'card',
}: {
  rows: PropertyRow[];
  // `plain` lines up with the issue sidebar it replaces: no card, a label
  // column, the value left-aligned with its hint on the same line.
  variant?: 'card' | 'plain';
}) =>
  variant === 'plain' ? (
    <div
      style={{
        columnGap: 12,
        display: 'grid',
        fontSize: 13,
        gridTemplateColumns: 'clamp(88px, 32%, 140px) minmax(0, 1fr)',
        lineHeight: '20px',
        rowGap: 10,
      }}
    >
      {rows.map((row) => (
        <Fragment key={row.key}>
          <span
            title={row.label}
            style={{
              color: INBOX_TOKENS.textTertiary,
              overflowWrap: 'anywhere',
            }}
          >
            {row.label}
          </span>
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            {row.value}
            {row.hint !== undefined && row.hint !== '' && (
              <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 12 }}>
                {' · '}
                {row.hint}
              </span>
            )}
          </span>
        </Fragment>
      ))}
    </div>
  ) : (
    <div
      style={{
        background: INBOX_TOKENS.background,
        border: `1px solid ${INBOX_TOKENS.borderLight}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {rows.map((row, index) => (
        <div
          key={row.key}
          style={{
            alignItems: 'flex-start',
            borderTop:
              index === 0 ? 'none' : `1px solid ${INBOX_TOKENS.borderLight}`,
            display: 'flex',
            fontSize: 12.5,
            gap: 10,
            padding: '9px 12px',
          }}
        >
          <span
            style={{
              alignItems: 'center',
              color: INBOX_TOKENS.textSecondary,
              display: 'flex',
              flexShrink: 0,
              gap: 8,
              lineHeight: '18px',
              maxWidth: '48%',
              minWidth: 0,
            }}
          >
            {row.icon !== undefined && (
              <span
                style={{
                  color: INBOX_TOKENS.textTertiary,
                  display: 'inline-flex',
                  flexShrink: 0,
                }}
              >
                {row.icon}
              </span>
            )}
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={row.label}
            >
              {row.label}
            </span>
          </span>
          <span
            style={{
              alignItems: 'flex-end',
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              gap: 1,
              minWidth: 0,
              textAlign: 'right',
            }}
          >
            <span
              style={{
                color: INBOX_TOKENS.textPrimary,
                fontWeight: 500,
                lineHeight: '18px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.value}
            </span>
            {row.hint !== undefined && row.hint !== '' && (
              <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 11 }}>
                {row.hint}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );

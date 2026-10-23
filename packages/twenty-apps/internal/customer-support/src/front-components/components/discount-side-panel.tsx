import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { DISCOUNT_TOKENS, spacing } from './discount-theme';

type DiscountSidePanelProps = {
  title: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  width: number | string;
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
};

// Docked to the right edge like Twenty's own side panel (a left border on the
// primary background, no backdrop), so the list stays usable beside it.
export const DiscountSidePanel = ({
  title,
  icon,
  aside,
  footer,
  width,
  ariaLabel,
  onClose,
  children,
}: DiscountSidePanelProps) => (
  <aside
    aria-label={ariaLabel}
    style={{
      background: DISCOUNT_TOKENS.background,
      borderLeft: `1px solid ${DISCOUNT_TOKENS.border}`,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      width,
    }}
  >
    <header
      style={{
        alignItems: 'center',
        borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
        display: 'flex',
        flexShrink: 0,
        gap: spacing(2),
        height: 48,
        padding: `0 ${spacing(2)} 0 ${spacing(4)}`,
      }}
    >
      {icon !== undefined && (
        <span style={{ color: DISCOUNT_TOKENS.textTertiary, display: 'inline-flex' }}>
          {icon}
        </span>
      )}
      <span
        style={{
          flex: 1,
          fontSize: DISCOUNT_TOKENS.fontSizeMd,
          fontWeight: DISCOUNT_TOKENS.fontWeightMedium,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>
      {aside}
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label={t('Close')}
        startIcon={<IconX size={16} />}
        onClick={onClose}
      />
    </header>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
    {footer !== undefined && (
      <footer
        style={{
          alignItems: 'center',
          borderTop: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
          display: 'flex',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: spacing(2),
          justifyContent: 'flex-end',
          padding: `${spacing(2)} ${spacing(3)}`,
        }}
      >
        {footer}
      </footer>
    )}
  </aside>
);

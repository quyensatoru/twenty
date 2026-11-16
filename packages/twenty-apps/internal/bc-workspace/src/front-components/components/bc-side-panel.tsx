import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { BC_TOKENS, spacing, THIN_SCROLLBAR_STYLE } from './bc-theme';

type BcSidePanelProps = {
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
// primary background, no backdrop), so the list beside it keeps its scroll
// position, filters and page while the panel is open.
export const BcSidePanel = ({
  title,
  icon,
  aside,
  footer,
  width,
  ariaLabel,
  onClose,
  children,
}: BcSidePanelProps) => (
  <aside
    aria-label={ariaLabel}
    style={{
      background: BC_TOKENS.background,
      borderLeft: `1px solid ${BC_TOKENS.border}`,
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
        borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
        display: 'flex',
        flexShrink: 0,
        gap: spacing(2),
        height: 48,
        padding: `0 ${spacing(2)} 0 ${spacing(4)}`,
      }}
    >
      {icon !== undefined && (
        <span style={{ color: BC_TOKENS.textTertiary, display: 'inline-flex' }}>
          {icon}
        </span>
      )}
      <span
        style={{
          flex: 1,
          fontSize: BC_TOKENS.fontSizeMd,
          fontWeight: BC_TOKENS.fontWeightMedium,
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
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', ...THIN_SCROLLBAR_STYLE }}>
      {children}
    </div>
    {footer !== undefined && (
      <footer
        style={{
          alignItems: 'center',
          borderTop: `1px solid ${BC_TOKENS.borderLight}`,
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

export const BcPanelSection = ({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) => (
  <section
    style={{
      borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing(2),
      padding: `${spacing(3)} ${spacing(4)}`,
    }}
  >
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: spacing(2),
        justifyContent: 'space-between',
        minHeight: 24,
      }}
    >
      <span
        style={{
          color: BC_TOKENS.textTertiary,
          fontSize: BC_TOKENS.fontSizeSm,
          fontWeight: BC_TOKENS.fontWeightMedium,
        }}
      >
        {title}
      </span>
      {aside}
    </div>
    {children}
  </section>
);

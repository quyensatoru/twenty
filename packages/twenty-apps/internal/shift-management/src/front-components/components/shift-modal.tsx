import { type ReactNode } from 'react';

import { SHIFT_TOKENS } from './shift-tokens';

type ShiftModalProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  width?: number;
};

// twenty-ui's Dialog is base-ui backed and cannot mount in the sandbox (it
// constructs a PointerEvent), and there is no `document` to portal into, so the
// modal is a fixed-position overlay inside the component tree. Clicking the
// backdrop closes it; clicks inside stop there because the panel sits above it
// rather than inside it.
export const ShiftModal = ({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 440,
}: ShiftModalProps) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      inset: 0,
      justifyContent: 'center',
      padding: 16,
      position: 'fixed',
      zIndex: 60,
    }}
  >
    <div
      onClick={onClose}
      style={{ background: SHIFT_TOKENS.overlay, inset: 0, position: 'fixed' }}
    />
    <div
      role="dialog"
      aria-label={title}
      style={{
        background: SHIFT_TOKENS.background,
        border: `1px solid ${SHIFT_TOKENS.border}`,
        borderRadius: SHIFT_TOKENS.radius,
        boxShadow: SHIFT_TOKENS.shadow,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxHeight: '80%',
        maxWidth: '100%',
        padding: 24,
        position: 'relative',
        width,
        zIndex: 61,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2
          style={{
            color: SHIFT_TOKENS.textPrimary,
            fontFamily: SHIFT_TOKENS.fontFamily,
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle === undefined ? null : (
          <p
            style={{
              color: SHIFT_TOKENS.textSecondary,
              fontFamily: SHIFT_TOKENS.fontFamily,
              fontSize: 13,
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {footer}
      </div>
    </div>
  </div>
);

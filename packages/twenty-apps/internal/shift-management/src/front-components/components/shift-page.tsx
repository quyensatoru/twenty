import { type ReactNode } from 'react';

import { SHIFT_TOKENS } from './shift-tokens';

type ShiftPageProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

// The page frame every shift screen shares: a header row and a scrolling body
// that fills the widget's TAB_VIEWPORT height.
export const ShiftPage = ({
  title,
  subtitle,
  actions,
  children,
}: ShiftPageProps) => (
  <main
    style={{
      background: SHIFT_TOKENS.backgroundSecondary,
      boxSizing: 'border-box',
      color: SHIFT_TOKENS.textPrimary,
      display: 'grid',
      fontFamily: SHIFT_TOKENS.fontFamily,
      gap: 16,
      gridTemplateRows: 'auto minmax(0, 1fr)',
      height: '100%',
      minHeight: '100%',
      overflow: 'hidden',
      padding: 16,
      width: '100%',
    }}
  >
    <header
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h1>
        {subtitle === undefined ? null : (
          <span style={{ color: SHIFT_TOKENS.textTertiary, fontSize: 12 }}>
            {subtitle}
          </span>
        )}
      </div>
      {actions}
    </header>
    <div style={{ minHeight: 0, overflow: 'auto' }}>{children}</div>
  </main>
);

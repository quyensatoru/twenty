import { type ReactNode } from 'react';

import { STUDIO_TOKENS } from './studio-tokens';

type StudioPanelProps = {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export const StudioPanel = ({ title, actions, children }: StudioPanelProps) => (
  <section
    style={{
      background: STUDIO_TOKENS.background,
      border: `1px solid ${STUDIO_TOKENS.border}`,
      borderRadius: STUDIO_TOKENS.radius,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0,
      padding: 16,
    }}
  >
    {title === undefined && actions === undefined ? null : (
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            color: STUDIO_TOKENS.textPrimary,
            fontSize: 13,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {actions}
      </header>
    )}
    {children}
  </section>
);

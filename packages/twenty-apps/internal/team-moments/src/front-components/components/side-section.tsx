import { type ReactNode } from 'react';

import { MOMENTS_TOKENS } from './moments-tokens';

type SideSectionProps = {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
};

export const SideSection = ({ title, aside, children }: SideSectionProps) => (
  <section style={{ borderRadius: 10, boxShadow: `0 0 0 1px ${MOMENTS_TOKENS.border}`, display: 'flex', flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, gap: 10, padding: 14 }}>
    <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
      <span style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 13, fontWeight: 600 }}>{title}</span>
      {aside === undefined ? null : <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 12, marginLeft: 'auto' }}>{aside}</span>}
    </div>
    {children}
  </section>
);

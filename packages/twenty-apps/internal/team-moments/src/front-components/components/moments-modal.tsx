import { type ReactNode } from 'react';

import { MOMENTS_TOKENS } from './moments-tokens';

type MomentsModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  width?: number;
};

// twenty-ui's Dialog cannot mount in the sandbox and there is no document to
// portal into, so the modal is a fixed overlay inside the component tree.
export const MomentsModal = ({ title, onClose, children, footer, width = 460 }: MomentsModalProps) => (
  <div style={{ alignItems: 'center', display: 'flex', inset: 0, justifyContent: 'center', padding: 16, position: 'fixed', zIndex: 60 }}>
    <div onClick={onClose} style={{ background: MOMENTS_TOKENS.overlay, inset: 0, position: 'fixed' }} />
    <div
      role="dialog"
      aria-label={title}
      style={{
        background: MOMENTS_TOKENS.background,
        border: `1px solid ${MOMENTS_TOKENS.border}`,
        borderRadius: MOMENTS_TOKENS.radius,
        boxShadow: MOMENTS_TOKENS.shadow,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxHeight: '86%',
        maxWidth: '100%',
        padding: 24,
        position: 'relative',
        width,
        zIndex: 61,
      }}
    >
      <h2 style={{ color: MOMENTS_TOKENS.textPrimary, fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 16, fontWeight: 600, margin: 0 }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto' }}>{children}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{footer}</div>
    </div>
  </div>
);

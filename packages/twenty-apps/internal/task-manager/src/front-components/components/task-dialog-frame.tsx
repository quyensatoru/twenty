import { type ReactNode, useEffect, useRef } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconX } from 'twenty-ui/icon';

import { TaskIconButton } from './task-icon-button';
import { TASK_TOKENS } from './task-tokens';

type TaskDialogFrameProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
};

// A small modal for the sprint forms. Rendered inside a <twenty-overlay>
// WITHOUT onClose, for the reason TaskBoardDetailFrame gives: the dropdowns
// inside it portal elsewhere and would count as outside clicks. The backdrop
// and Escape close it instead.
export const TaskDialogFrame = ({
  title,
  onClose,
  children,
  footer,
}: TaskDialogFrameProps) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // autoFocus is a no-op on the sandbox's custom elements, and Escape only
  // reaches onKeyDown from inside the dialog.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        // Small enough that a phone keeps the dialog almost full width.
        padding: 16,
        position: 'fixed',
        zIndex: 70,
      }}
    >
      <div
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.45)', inset: 0, position: 'fixed' }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-label={title}
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
        style={{
          background: TASK_TOKENS.background,
          border: `1px solid ${TASK_TOKENS.borderLight}`,
          borderRadius: 12,
          boxShadow: TASK_TOKENS.shadowStrong,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: TASK_TOKENS.fontFamily,
          maxHeight: 'calc(100vh - 32px)',
          maxWidth: '100%',
          position: 'relative',
          width: 520,
          zIndex: 71,
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 8,
            padding: '16px 20px 8px 20px',
          }}
        >
          <span
            style={{
              color: TASK_TOKENS.textPrimary,
              flex: 1,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {title}
          </span>
          <TaskIconButton label={t('Close')} onClick={onClose}>
            <IconX size={16} />
          </TaskIconButton>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            minHeight: 0,
            overflowY: 'auto',
            padding: '8px 20px 16px 20px',
          }}
        >
          {children}
        </div>
        <div
          style={{
            borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            padding: '12px 20px',
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
};

// A labelled form row inside a dialog.
export const TaskDialogField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span
      style={{
        color: TASK_TOKENS.textSecondary,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
    {children}
  </label>
);

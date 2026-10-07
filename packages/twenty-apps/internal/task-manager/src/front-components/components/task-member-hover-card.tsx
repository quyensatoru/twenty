import { type ReactNode, useEffect, useRef, useState } from 'react';

import { TaskAvatar } from './task-avatar';
import { TASK_TOKENS } from './task-tokens';

const CARD_AVATAR_SIZE = 40;
// Clear of the 24px row avatar it hangs under.
const CARD_OFFSET = 26;
// Long enough to carry the pointer across the gap from the name onto the card,
// which lives in a body portal and so is not inside the anchor's hover area.
const CLOSE_DELAY_MS = 120;

type TaskMemberHoverCardProps = {
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  children: ReactNode;
};

// Who wrote this, without leaving the thread: the feed can only afford a first
// name and a 24px circle, and two people with the same first name are
// indistinguishable at that size.
//
// Hover is state-driven rather than CSS: an app ships no stylesheet, so there
// is no `:hover` rule to declare. The card renders through the host overlay:
// feed rows use content-visibility, whose paint containment clips anything
// drawn past the row and traps its z-index.
export const TaskMemberHoverCard = ({
  name,
  email,
  avatarUrl,
  children,
}: TaskMemberHoverCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // oxlint-disable-next-line twenty/no-state-useref
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const open = () => {
    cancelClose();
    setIsOpen(true);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  };

  useEffect(() => cancelClose, []);

  return (
    <span
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      style={{ display: 'inline-flex', position: 'relative' }}
    >
      {children}
      {isOpen && (
        <twenty-overlay offsetX={0} offsetY={CARD_OFFSET}>
          <span
            role="tooltip"
            onMouseEnter={open}
            onMouseLeave={scheduleClose}
            style={{
              alignItems: 'center',
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radius,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              display: 'flex',
              fontFamily: TASK_TOKENS.fontFamily,
              gap: 10,
              padding: 10,
              userSelect: 'text',
            }}
          >
            <TaskAvatar
              name={name}
              avatarUrl={avatarUrl}
              size={CARD_AVATAR_SIZE}
              shouldShowTitle={false}
            />
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: TASK_TOKENS.textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </span>
              <span
                style={{
                  color: TASK_TOKENS.textTertiary,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                {email ?? ''}
              </span>
            </span>
          </span>
        </twenty-overlay>
      )}
    </span>
  );
};

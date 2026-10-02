import { type ReactNode, useState } from 'react';

import { TaskAvatar } from './task-avatar';
import { TASK_TOKENS } from './task-tokens';

const CARD_AVATAR_SIZE = 40;
// Clear of the 24px row avatar it hangs under, so moving the pointer from the
// name onto the card never crosses a gap that would close it.
const CARD_OFFSET = 22;

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
// is no `:hover` rule to declare and no popover element to position.
export const TaskMemberHoverCard = ({
  name,
  email,
  avatarUrl,
  children,
}: TaskMemberHoverCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      style={{ display: 'inline-flex', position: 'relative' }}
    >
      {children}
      {isOpen && (
        <span
          role="tooltip"
          style={{
            alignItems: 'center',
            background: TASK_TOKENS.background,
            border: `1px solid ${TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radius,
            boxShadow: TASK_TOKENS.shadowStrong,
            display: 'flex',
            gap: 10,
            left: 0,
            padding: 10,
            position: 'absolute',
            top: CARD_OFFSET,
            // Above the rows below it, and above the sticky tab strip a card
            // opened on the first comment would otherwise slide under.
            zIndex: 3,
          }}
        >
          <TaskAvatar
            name={name}
            avatarUrl={avatarUrl}
            size={CARD_AVATAR_SIZE}
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
      )}
    </span>
  );
};

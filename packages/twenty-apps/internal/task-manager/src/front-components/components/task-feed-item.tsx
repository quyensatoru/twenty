import { type ReactNode, useState } from 'react';

import { formatDateTimeLabel } from '../utils/format-date-time-label.util';
import { formatRelativeTimeLabel } from '../utils/format-relative-time-label.util';
import { TaskAvatar } from './task-avatar';
import { TaskMemberHoverCard } from './task-member-hover-card';
import { TASK_TOKENS } from './task-tokens';

const AVATAR_SIZE = 24;
const AVATAR_GAP = 10;

// Where a feed row's text column starts, measured from the row's own left edge.
// Exported so the composers can indent to the same line: a composer that starts
// flush with the panel while every row under it starts 34px in reads as two
// different lists.
export const FEED_BODY_INDENT = AVATAR_SIZE + AVATAR_GAP;

// Keeps a row's own box — its hover tint, its highlight ring — clear of the
// Activity card's border, which it otherwise runs straight into. Applied by the
// lists to their whole column, so the composer above the rows moves with them.
export const FEED_INLINE_INSET = 8;
// The name line is exactly as tall as the row actions, so a row without them
// is the same height as a row with them and the feed keeps one rhythm.
const HEADER_HEIGHT = 24;

type TaskFeedItemProps = {
  // Addresses the row from a copy-link fragment. Also the DOM id, so a link
  // somebody keeps is still a valid anchor on the page itself.
  anchorId?: string;
  // The row a deep link asked for. The feed cannot scroll to it — the sandbox's
  // elements have no scrollIntoView — so being marked is the whole of what
  // "the link landed here" can say.
  isHighlighted?: boolean;
  authorName: string;
  authorEmail?: string | null;
  avatarUrl?: string | null;
  // Raw, not formatted: the row prints it relative and keeps the exact time on
  // the title, and the three lists must not each decide that for themselves.
  timestamp?: string | null;
  // Sits beside the author name: a duration, a status transition, whatever the
  // row is about when that is one short phrase rather than a body.
  meta?: ReactNode;
  actions?: ReactNode;
  // Drawn under the body, in the body's column. Reply composers go here, so
  // they line up with the text they answer rather than with the avatar.
  footer?: ReactNode;
  children?: ReactNode;
};

// One row shape for comments, worklogs and history, because the three are one
// feed under three tabs rather than three lists that happen to share a panel:
// avatar, author, what happened, when.
//
// Actions appear on hover. An app ships no stylesheet, so there is no `:hover`
// to declare and the state has to be held here.
export const TaskFeedItem = ({
  anchorId,
  isHighlighted = false,
  authorName,
  authorEmail,
  avatarUrl,
  timestamp,
  meta,
  actions,
  footer,
  children,
}: TaskFeedItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <article
      id={anchorId}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHighlighted
          ? TASK_TOKENS.accentSoft
          : isHovered
            ? TASK_TOKENS.backgroundTransparentLighter
            : 'transparent',
        borderRadius: TASK_TOKENS.radius,
        // Inside the radius rather than around it, so a highlighted row is the
        // same height as the rows above and below it.
        boxShadow: isHighlighted
          ? `inset 0 0 0 1px ${TASK_TOKENS.accent}`
          : 'none',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: AVATAR_GAP,
        minWidth: 0,
        // The rows used to butt straight against each other and against the
        // panel edge: a comment is a block of prose, and prose needs a margin
        // to read as its own block rather than as more of the one above.
        padding: '8px 10px',
      }}
    >
      <TaskMemberHoverCard
        name={authorName}
        email={authorEmail}
        avatarUrl={avatarUrl}
      >
        <TaskAvatar
          name={authorName}
          avatarUrl={avatarUrl}
          size={AVATAR_SIZE}
        />
      </TaskMemberHoverCard>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
        }}
      >
        <header
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 8,
            minHeight: HEADER_HEIGHT,
          }}
        >
          <TaskMemberHoverCard
            name={authorName}
            email={authorEmail}
            avatarUrl={avatarUrl}
          >
            <span
              style={{
                color: TASK_TOKENS.textPrimary,
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 600,
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {authorName}
            </span>
          </TaskMemberHoverCard>
          {meta}
          <span style={{ flex: 1, minWidth: 0 }} />
          {actions !== undefined && (
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                flexShrink: 0,
                gap: 2,
                // Held in the layout whether shown or not: revealing the
                // buttons on hover must not reflow the row under the pointer.
                pointerEvents: isHovered ? 'auto' : 'none',
                visibility: isHovered ? 'visible' : 'hidden',
              }}
            >
              {actions}
            </div>
          )}
        </header>

        {children}

        <span
          title={formatDateTimeLabel(timestamp)}
          style={{
            color: TASK_TOKENS.textTertiary,
            fontSize: 11,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {formatRelativeTimeLabel(timestamp)}
        </span>

        {footer}
      </div>
    </article>
  );
};

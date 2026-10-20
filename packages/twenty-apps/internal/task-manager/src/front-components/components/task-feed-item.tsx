import { type ReactNode, useEffect, useRef, useState } from 'react';

import { formatDateTimeLabel } from '../utils/format-date-time-label.util';
import { formatRelativeTimeLabel } from '../utils/format-relative-time-label.util';
import { TaskAvatar } from './task-avatar';
import { TaskMemberHoverCard } from './task-member-hover-card';
import { TASK_TOKENS } from './task-tokens';

const AVATAR_SIZE = 20;
const REPLY_AVATAR_SIZE = 18;
const AVATAR_GAP = 10;
const CONTENT_PADDING_TOP = 6;
const CONTENT_PADDING_INLINE = 10;
// Tall enough for a 24px icon button, so a row without one keeps the rhythm.
const HEADER_HEIGHT = 22;

// Where a feed row's text column starts, measured from the row's own left edge.
// Exported so the composers can indent to the same line: a composer that starts
// flush with the panel while every row under it starts 34px in reads as two
// different lists.
export const FEED_BODY_INDENT = AVATAR_SIZE + AVATAR_GAP;

// No inset of the feed's own: the activity sits in the issue column with the
// sub-issue list and the tab row, and an extra 8px each side left its edges
// out of line with theirs.
export const FEED_INLINE_INSET = 0;
// From the content block's edge to its text: an empty-state line under the
// composer starts here so it reads as part of the same column.
export const FEED_TEXT_INSET = CONTENT_PADDING_INLINE;
// Between rows. The content block's own padding does the rest of the spacing.
export const FEED_GAP = 6;
// Where a reply's avatar starts: under the parent's text, not its avatar.
export const FEED_THREAD_INDENT = FEED_BODY_INDENT + FEED_TEXT_INSET;
// The x of the parent avatar's centre, where a thread's connector runs.
export const FEED_THREAD_LINE_LEFT = AVATAR_SIZE / 2 - 0.5;
// How far down a reply row its connector turns into it: its avatar's centre.
export const FEED_REPLY_ELBOW_TOP = CONTENT_PADDING_TOP + HEADER_HEIGHT / 2;

type TaskFeedItemProps = {
  // Addresses the row from a copy-link fragment. Also the DOM id, so a link
  // somebody keeps is still a valid anchor on the page itself.
  anchorId?: string;
  // The row a deep link asked for.
  isHighlighted?: boolean;
  authorName: string;
  authorEmail?: string | null;
  avatarUrl?: string | null;
  // Raw, not formatted: the row prints it relative and keeps the exact time on
  // the title, and the lists must not each decide that for themselves.
  timestamp?: string | null;
  // Sits beside the author name: a duration, whatever the row is about when
  // that is one short phrase rather than a body.
  meta?: ReactNode;
  // A reply in a thread: a smaller face.
  isReply?: boolean;
  // Follows a row by the same person moments before: no avatar or name, and
  // the time shows in the avatar column under the pointer.
  isGrouped?: boolean;
  // A thread hangs under this row: the connector starts at its avatar.
  hasThread?: boolean;
  // The start of the row under the body, always shown: reactions, reply.
  actions?: ReactNode;
  // After `actions`, shown only under the pointer. Hidden rather than removed,
  // so the row keeps its width and nothing beside them moves.
  hoverActions?: ReactNode;
  // Keeps `hoverActions` shown: an open menu, or a screen without a pointer.
  shouldShowHoverActions?: boolean;
  // After the buttons: sending, failed, read by.
  status?: ReactNode;
  children?: ReactNode;
};

const formatClockTime = (value: string | null | undefined): string => {
  const parsed = new Date(value ?? '');

  return Number.isNaN(parsed.getTime())
    ? ''
    : // 24-hour, so the label fits the avatar column: "11:50 AM" ran into
      // the text beside it.
      parsed.toLocaleTimeString(undefined, {
        hour: '2-digit',
        hourCycle: 'h23',
        minute: '2-digit',
      });
};

// One row shape for comments and worklogs, because the two are one feed under
// two tabs: avatar, author, when, what. No frame around a row; the content
// block takes a light tint under the pointer instead.
//
// The hover tint is state-driven: an app ships no stylesheet, so there is no
// `:hover` to declare and the state has to be held here.
export const TaskFeedItem = ({
  anchorId,
  isHighlighted = false,
  authorName,
  authorEmail,
  avatarUrl,
  timestamp,
  meta,
  isReply = false,
  isGrouped = false,
  hasThread = false,
  actions,
  hoverActions,
  shouldShowHoverActions = false,
  status,
  children,
}: TaskFeedItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!isHighlighted) return;
    const article = articleRef.current;
    if (article === null) return;

    const alignIfOutsideView = () => {
      if (document.activeElement !== article) return;
      for (
        let parent = article.parentElement;
        parent !== null && parent !== document.body;
        parent = parent.parentElement
      ) {
        if (parent.scrollHeight <= parent.clientHeight + 1) continue;
        const articleBounds = article.getBoundingClientRect();
        const parentBounds = parent.getBoundingClientRect();
        const inset = 24;
        if (
          articleBounds.top >= parentBounds.top + inset &&
          articleBounds.bottom <= parentBounds.bottom - inset
        )
          return;
        const desiredTop =
          parentBounds.top + Math.min(parent.clientHeight * 0.2, 120);
        parent.scrollTop += articleBounds.top - desiredTop;
        return;
      }
    };

    article.focus();
    const timers = [0, 150, 450].map((delay) =>
      window.setTimeout(alignIfOutsideView, delay),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [isHighlighted]);
  // Hover-only buttons cannot take focus while hidden, so tabbing onto the
  // row's first button reveals the rest.
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const isActive = isHovered || hasFocusWithin;
  const avatarSize = isReply ? REPLY_AVATAR_SIZE : AVATAR_SIZE;
  const avatarTop = FEED_REPLY_ELBOW_TOP - avatarSize / 2;
  const shouldShowHeader = !isGrouped || meta !== undefined;
  // With nothing always shown under the body (a worklog), the hover buttons
  // ride at the end of the header instead: a reserved footer would leave an
  // empty line under every row.
  const hasHeaderHoverActions =
    shouldShowHeader &&
    actions === undefined &&
    status === undefined &&
    hoverActions !== undefined;
  const hasFooter =
    !hasHeaderHoverActions &&
    (actions !== undefined ||
      hoverActions !== undefined ||
      status !== undefined);
  const hoverActionsVisibility =
    isActive || isHighlighted || shouldShowHoverActions ? 'visible' : 'hidden';

  return (
    <article
      id={anchorId}
      ref={articleRef}
      tabIndex={isHighlighted ? -1 : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocusWithin(true)}
      onBlur={() => setHasFocusWithin(false)}
      style={{
        alignItems: 'flex-start',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: AVATAR_GAP,
        minWidth: 0,
        outline: 'none',
        position: 'relative',
        scrollMarginBlock: 'min(22vh, 140px)',
        userSelect: 'text',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          flexShrink: 0,
          paddingTop: isGrouped ? CONTENT_PADDING_TOP + 4 : avatarTop,
          width: avatarSize,
        }}
      >
        {isGrouped ? (
          <span
            title={formatDateTimeLabel(timestamp)}
            style={{
              color: TASK_TOKENS.textTertiary,
              fontSize: 10,
              fontVariantNumeric: 'tabular-nums',
              visibility: isActive && !shouldShowHeader ? 'visible' : 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {formatClockTime(timestamp)}
          </span>
        ) : (
          <TaskMemberHoverCard
            name={authorName}
            email={authorEmail}
            avatarUrl={avatarUrl}
          >
            <TaskAvatar
              name={authorName}
              avatarUrl={avatarUrl}
              size={avatarSize}
              shouldShowTitle={false}
            />
          </TaskMemberHoverCard>
        )}
      </span>
      {hasThread && (
        <span
          aria-hidden
          style={{
            background: TASK_TOKENS.border,
            bottom: 0,
            left: FEED_THREAD_LINE_LEFT,
            position: 'absolute',
            top: avatarTop + avatarSize + 4,
            width: 1,
          }}
        />
      )}
      <div
        style={{
          background: isHighlighted
            ? TASK_TOKENS.accentSoft
            : isHovered
              ? TASK_TOKENS.backgroundHover
              : 'transparent',
          borderRadius: TASK_TOKENS.radius,
          boxShadow:
            isHighlighted && hasFocusWithin
              ? `inset 0 0 0 1px ${TASK_TOKENS.accent}`
              : undefined,
          boxSizing: 'border-box',
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 3,
          minWidth: 0,
          padding: `${CONTENT_PADDING_TOP}px ${CONTENT_PADDING_INLINE}px 8px`,
        }}
      >
        {shouldShowHeader && (
          <header
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 8,
              minHeight: HEADER_HEIGHT,
              minWidth: 0,
            }}
          >
            {!isGrouped && (
              <TaskMemberHoverCard
                name={authorName}
                email={authorEmail}
                avatarUrl={avatarUrl}
              >
                <span
                  style={{
                    color: TASK_TOKENS.textPrimary,
                    flexShrink: 0,
                    fontSize: 13,
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
            )}
            {meta}
            <span
              title={formatDateTimeLabel(timestamp)}
              style={{
                color: TASK_TOKENS.textTertiary,
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {formatRelativeTimeLabel(timestamp)}
            </span>
            {hasHeaderHoverActions && (
              <span
                style={{
                  alignItems: 'center',
                  display: 'inline-flex',
                  gap: 2,
                  marginLeft: 'auto',
                  visibility: hoverActionsVisibility,
                }}
              >
                {hoverActions}
              </span>
            )}
          </header>
        )}

        {children}

        {hasFooter && (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              // The icons' own padding, so the first glyph sits on the text's
              // left edge.
              marginLeft: -4,
              marginTop: 2,
              minHeight: 24,
            }}
          >
            {actions}
            {hoverActions !== undefined && (
              <span
                style={{
                  alignItems: 'center',
                  display: 'inline-flex',
                  gap: 2,
                  visibility: hoverActionsVisibility,
                }}
              >
                {hoverActions}
              </span>
            )}
            {status}
          </div>
        )}
      </div>
    </article>
  );
};

// The composer on top of a feed, drawn as the row it will become: the
// writer's avatar in the avatar column, the box in the body column.
export const TaskFeedComposerRow = ({
  name,
  avatarUrl,
  isReply = false,
  children,
}: {
  name: string;
  avatarUrl?: string | null;
  isReply?: boolean;
  children: ReactNode;
}) => {
  const avatarSize = isReply ? REPLY_AVATAR_SIZE : AVATAR_SIZE;

  return (
    <div style={{ display: 'flex', gap: AVATAR_GAP, minWidth: 0 }}>
      <span
        style={{
          display: 'inline-flex',
          flexShrink: 0,
          paddingTop: 12 + (AVATAR_SIZE - avatarSize) / 2,
        }}
      >
        <TaskAvatar
          name={name}
          avatarUrl={avatarUrl}
          size={avatarSize}
          shouldShowTitle={false}
        />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
};

const THREAD_GAP = 2;
const ELBOW_RADIUS = 8;
// Stops the elbow short of the reply's avatar.
const ELBOW_CLEARANCE = 4;

// Replies under the row they answer, their avatars on the parent's text line.
export const TaskFeedThread = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: THREAD_GAP,
      marginLeft: FEED_THREAD_INDENT,
      minWidth: 0,
      paddingTop: THREAD_GAP,
    }}
  >
    {children}
  </div>
);

// One row of a thread with its connector: a rounded elbow from the trunk into
// the row at `elbowTop`, and the trunk carried on past it when more rows
// follow. Drawn per row because the app ships no stylesheet, so there is no
// ::before to hang a line on and the rows' heights are not known here.
export const TaskFeedThreadRow = ({
  isLast,
  elbowTop = FEED_REPLY_ELBOW_TOP,
  children,
}: {
  isLast: boolean;
  elbowTop?: number;
  children: ReactNode;
}) => {
  const lineLeft = FEED_THREAD_LINE_LEFT - FEED_THREAD_INDENT;

  return (
    <div style={{ minWidth: 0, position: 'relative' }}>
      <span
        aria-hidden
        style={{
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          borderBottomLeftRadius: ELBOW_RADIUS,
          borderLeft: `1px solid ${TASK_TOKENS.border}`,
          boxSizing: 'border-box',
          height: elbowTop + THREAD_GAP,
          left: lineLeft,
          position: 'absolute',
          top: -THREAD_GAP,
          width: -lineLeft - ELBOW_CLEARANCE,
        }}
      />
      {!isLast && (
        <span
          aria-hidden
          style={{
            background: TASK_TOKENS.border,
            bottom: -THREAD_GAP,
            left: lineLeft,
            position: 'absolute',
            top: 0,
            width: 1,
          }}
        />
      )}
      {children}
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconMoodSmile } from 'twenty-ui/icon';

import {
  DISCUSSION_REACTIONS,
  type DiscussionReaction,
} from '../hooks/use-discussion-state';
import { type MemberRow } from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { TASK_TOKENS } from './task-tokens';

type TaskCommentReactionsProps = {
  commentId: string;
  reactions: DiscussionReaction[];
  currentMemberId: string | null;
  membersById: Map<string, MemberRow>;
  canReact: boolean;
  onReact?: (commentId: string, emoji: string, active: boolean) => void;
  // Off when the comment has no reactions yet and only the picker is shown,
  // on the bubble's header beside the other hover actions.
  shouldShowChips?: boolean;
  // Off under the body: the picker lives with the other hover actions.
  shouldShowPicker?: boolean;
};

export const TaskCommentReactions = ({
  commentId,
  reactions,
  currentMemberId,
  membersById,
  canReact,
  onReact,
  shouldShowChips = true,
  shouldShowPicker = true,
}: TaskCommentReactionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const choices = useRef<(HTMLButtonElement | null)[]>([]);
  const matchingReactions = (emoji: string) =>
    reactions.filter(
      (reaction) =>
        reaction.commentId === commentId && reaction.emoji === emoji,
    );
  const isActive = (emoji: string) =>
    matchingReactions(emoji).some(
      (reaction) => reaction.memberId === currentMemberId,
    );
  const closeAndFocus = () => {
    setIsOpen(false);
    trigger.current?.focus();
  };

  useEffect(() => {
    if (isOpen) choices.current[focusedIndex]?.focus();
  }, [isOpen, focusedIndex]);

  return (
    <>
      {canReact && shouldShowPicker && (
        <span style={{ display: 'inline-flex', position: 'relative' }}>
          <button
            ref={trigger}
            type="button"
            aria-label={t('Add reaction')}
            title={t('Add reaction')}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={() => {
              setFocusedIndex(0);
              setIsOpen((previous) => !previous);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              borderRadius: TASK_TOKENS.radiusSmall,
              background: isOpen ? TASK_TOKENS.backgroundHover : 'transparent',
              color: isOpen ? TASK_TOKENS.accent : TASK_TOKENS.textTertiary,
              cursor: 'pointer',
            }}
          >
            <IconMoodSmile size={14} />
          </button>
          {isOpen && (
            <twenty-overlay offsetY={28} onClose={() => setIsOpen(false)}>
              <div
                role="menu"
                aria-label={t('Choose a reaction')}
                onKeyDown={(event) => {
                  const key = event.key;
                  if (key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    closeAndFocus();
                  } else if (key === 'Tab') {
                    setIsOpen(false);
                  } else if (
                    [
                      'ArrowRight',
                      'ArrowLeft',
                      'ArrowDown',
                      'ArrowUp',
                      'Home',
                      'End',
                    ].includes(key)
                  ) {
                    event.preventDefault();
                    const count = DISCUSSION_REACTIONS.length;
                    setFocusedIndex((previous) =>
                      key === 'Home'
                        ? 0
                        : key === 'End'
                          ? count - 1
                          : (previous +
                              (key === 'ArrowLeft' || key === 'ArrowUp'
                                ? -1
                                : 1) +
                              count) %
                            count,
                    );
                  }
                }}
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: 6,
                  background: TASK_TOKENS.background,
                  border: `1px solid ${TASK_TOKENS.border}`,
                  borderRadius: TASK_TOKENS.radius,
                  boxShadow: TASK_TOKENS.shadowStrong,
                }}
              >
                {DISCUSSION_REACTIONS.map((emoji, index) => (
                  <button
                    key={emoji}
                    ref={(element) => {
                      choices.current[index] = element;
                    }}
                    type="button"
                    role="menuitemcheckbox"
                    aria-label={`${t('React')} ${emoji}`}
                    aria-checked={isActive(emoji)}
                    tabIndex={focusedIndex === index ? 0 : -1}
                    onFocus={() => setFocusedIndex(index)}
                    onClick={() => {
                      onReact?.(commentId, emoji, !isActive(emoji));
                      closeAndFocus();
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      padding: 0,
                      border: 'none',
                      borderRadius: TASK_TOKENS.radiusSmall,
                      background: isActive(emoji)
                        ? TASK_TOKENS.accentSoft
                        : focusedIndex === index
                          ? TASK_TOKENS.backgroundHover
                          : 'transparent',
                      fontSize: 22,
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </twenty-overlay>
          )}
        </span>
      )}
      {shouldShowChips &&
        DISCUSSION_REACTIONS.map((emoji) => {
          const matching = matchingReactions(emoji);
          if (matching.length === 0) return null;
          const active = isActive(emoji);
          return (
            <button
              key={emoji}
              type="button"
              aria-label={`${t('React')} ${emoji}`}
              aria-pressed={active}
              disabled={!canReact}
              onClick={() => onReact?.(commentId, emoji, !active)}
              title={matching
                .map((reaction) =>
                  readMemberName(membersById, reaction.memberId, t('Unknown')),
                )
                .join(', ')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                height: 22,
                padding: '0 7px',
                border: `1px solid ${active ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
                // A pill, as in the design: a square chip read as a button.
                borderRadius: 11,
                background: active
                  ? TASK_TOKENS.accentSoft
                  : TASK_TOKENS.background,
                color: active ? TASK_TOKENS.accent : TASK_TOKENS.textSecondary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
                cursor: canReact ? 'pointer' : 'default',
              }}
            >
              {emoji} {matching.length}
            </button>
          );
        })}
    </>
  );
};

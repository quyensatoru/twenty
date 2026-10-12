import { useEffect, useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { type MemberRow } from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskAvatar } from './task-avatar';
import { getTaskControlStyle } from './task-control-styles';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

type TaskMentionPopoverProps = {
  members: MemberRow[];
  query: string;
  onSelect: (member: MemberRow) => void;
  onClose: () => void;
};

export const TaskMentionPopover = ({
  members,
  query,
  onSelect,
  onClose,
}: TaskMentionPopoverProps) => {
  const [initialQuery] = useState(query);
  const [search, setSearch] = useState(query);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const membersById = new Map(members.map((member) => [member.id, member]));
  const options = members.filter((member) =>
    `${readMemberName(membersById, member.id, '')} ${member.userEmail ?? ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const selectedIndex = Math.min(activeIndex, Math.max(0, options.length - 1));

  const visibleStartIndex = Math.max(0, selectedIndex - 3);

  useEffect(() => {
    const input = searchRef.current;
    if (input === null) return;
    // defaultValue does not seed value in the sandbox; React reads value.length
    // when restoring the selection after an asynchronous focus change.
    input.value = initialQuery;
    input.focus();
  }, [initialQuery]);
  const move = (direction: number) => {
    if (options.length === 0) return;
    const nextIndex =
      (selectedIndex + direction + options.length) % options.length;
    setActiveIndex(nextIndex);
  };

  return (
    <div
      style={{
        ...TASK_THIN_SCROLLBAR_STYLE,
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        boxShadow: TASK_TOKENS.shadowStrong,
        width: 320,
        maxWidth: 'calc(100vw - 32px)',
        padding: 4,
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        color: TASK_TOKENS.textPrimary,
        fontFamily: TASK_TOKENS.fontFamily,
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (options[selectedIndex]) onSelect(options[selectedIndex]);
        }}
      >
        <div style={{ padding: 4 }}>
          <input
            ref={searchRef}
            aria-label={t('Search members')}
            aria-controls="task-mention-options"
            aria-expanded
            aria-activedescendant={
              options[selectedIndex]
                ? `task-mention-${options[selectedIndex].id}`
                : undefined
            }
            role="combobox"
            aria-autocomplete="list"
            defaultValue={query}
            placeholder={t('Search by name or email…')}
            onChange={(event) => {
              setSearch(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                move(event.key === 'ArrowDown' ? 1 : -1);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                onClose();
              }
            }}
            style={{
              ...getTaskControlStyle(false),
              height: 32,
              padding: '0 8px',
            }}
          />
        </div>
        <div
          id="task-mention-options"
          role="listbox"
          aria-label={t('Mention a member')}
          style={{
            ...TASK_THIN_SCROLLBAR_STYLE,
            maxHeight: 256,
            overflowY: 'auto',
          }}
        >
          {options.length === 0 && (
            <div
              role="status"
              style={{
                padding: 12,
                color: TASK_TOKENS.textTertiary,
                fontSize: 12,
              }}
            >
              {members.length === 0
                ? t('No members have read access to this app')
                : t('No matching members')}
            </div>
          )}
          {options
            .slice(visibleStartIndex, visibleStartIndex + 4)
            .map((member, visibleIndex) => {
              const index = visibleStartIndex + visibleIndex;
              const name = readMemberName(
                membersById,
                member.id,
                member.userEmail || t('Unknown'),
              );
              return (
                <button
                  key={member.id}
                  id={`task-mention-${member.id}`}
                  role="option"
                  aria-label={`${name}${member.userEmail ? ` ${member.userEmail}` : ''}`}
                  aria-selected={index === selectedIndex}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => onSelect(member)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: TASK_TOKENS.radiusExtraSmall,
                    background:
                      index === selectedIndex
                        ? TASK_TOKENS.backgroundHover
                        : 'transparent',
                    padding: '8px 10px',
                    color: TASK_TOKENS.textPrimary,
                    fontFamily: TASK_TOKENS.fontFamily,
                    cursor: 'pointer',
                  }}
                >
                  <TaskAvatar
                    name={name}
                    avatarUrl={member.avatarUrl}
                    size={28}
                    shouldShowTitle={false}
                  />
                  <span
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </span>
                    <span
                      style={{
                        color: TASK_TOKENS.textTertiary,
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {member.userEmail || t('Email unavailable')}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>
        <div
          style={{
            borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
            padding: '8px 10px',
            color: TASK_TOKENS.textTertiary,
            fontSize: 11,
          }}
        >
          {t('↑ ↓ to navigate · Enter to select · Esc to close')}
        </div>
      </form>
    </div>
  );
};

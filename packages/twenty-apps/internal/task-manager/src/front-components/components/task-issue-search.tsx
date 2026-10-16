import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCalendarEvent, IconFlag, IconPlus, IconSearch, IconX } from 'twenty-ui/icon';

import { SEARCH_ISSUES_ROUTE_PATH } from '../../constants/route-paths';
import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import {
  type BoardIssue,
  type IssueSearchResponse,
} from '../../types/task-board';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskAvatar } from './task-avatar';
import { getTaskControlStyle, TASK_BARE_FIELD_STYLE } from './task-control-styles';
import { TaskTag } from './task-tag';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';

type TaskIssueSearchProps = {
  // The board owns the text, but typing never narrows the columns — it only
  // feeds this popover, so the board under the pointer stays put while the
  // matches surface for a jump straight to their modal.
  value: string;
  onChange: (value: string) => void;
  // A picked result jumps the board to the result's project and opens its
  // modal — the issue may live outside the project on screen.
  onSelectIssue: (issue: BoardIssue) => void;
  maxWidth?: number | string;
  // `small` sits in the board toolbar beside 28px controls; `large` is a
  // raised search that reads as the page's main entry point.
  size?: 'small' | 'medium' | 'large';
  placeholder?: string;
  // Rows that must never be offered: linking them would loop the tree (the
  // issue itself, its current children, its parent). The server takes any
  // parentId without a cycle check, so the picker is where the loop stops.
  excludeIds?: readonly string[];
  // When set, the popover grows a final `+ Create "query"` row and Enter on
  // it (or on an empty query with the popover closed) calls through here —
  // one box that both links what exists and creates what does not.
  onCreateNew?: () => void;
  ariaLabel?: string;
  // Focus the field when it appears, for a box opened by an "Add" row.
  shouldAutoFocus?: boolean;
  // Leaving the field empty closes it, as the "Add" row's own cancel.
  onDismiss?: () => void;
};

type SearchState = {
  response: IssueSearchResponse | null;
  isLoading: boolean;
  error: string | null;
};

const DEBOUNCE_MS = 300;
const INPUT_HEIGHT = 36;
const SMALL_INPUT_HEIGHT = 28;
const LARGE_INPUT_HEIGHT = 40;
// Falls back to this when the search width is fluid (a "100%" maxWidth the
// popover cannot measure — it lives in a body portal, not under the field).
const POPOVER_WIDTH = 480;

// Search across every project the caller may read: matches surface in a
// popover under the field, with key, status, owner and project at a glance,
// and picking one jumps straight to its modal.
export const TaskIssueSearch = ({
  value,
  onChange,
  onSelectIssue,
  maxWidth = 520,
  size = 'medium',
  placeholder,
  excludeIds,
  onCreateNew,
  ariaLabel,
  shouldAutoFocus = false,
  onDismiss,
}: TaskIssueSearchProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // Pressing a result takes focus from the input before the click lands. If
  // the list followed focus alone it would unmount on that press and the
  // click would hit nothing, so it also stays while the pointer is over it.
  const [isPointerOverPopover, setIsPointerOverPopover] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [state, setState] = useState<SearchState>({
    response: null,
    isLoading: false,
    error: null,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  // autoFocus is a no-op on the sandbox's elements, so focus is asked for.
  useEffect(() => {
    if (shouldAutoFocus) {
      inputRef.current?.focus();
    }
  }, [shouldAutoFocus]);
  // Every keystroke fires its own request; only the latest may paint, so a
  // slow earlier page never overwrites a fresh one.
  // oxlint-disable-next-line twenty/no-state-useref
  const requestIdRef = useRef(0);

  const query = value.trim();
  const isLarge = size === 'large';
  const isSmall = size === 'small';
  const inputHeight = isLarge
    ? LARGE_INPUT_HEIGHT
    : isSmall
      ? SMALL_INPUT_HEIGHT
      : INPUT_HEIGHT;
  // Every query is searched, the empty one included: with nothing typed the
  // route lists the most recently updated issues, so a click alone shows
  // candidates the way a link picker does.
  useEffect(() => {
    // Asked only while open: a search box sitting in a toolbar must not
    // fetch on every page load.
    if (!isOpen) {
      return;
    }

    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const timer = window.setTimeout(() => {
      void postAppRoute<IssueSearchResponse & { success: boolean }>(
        SEARCH_ISSUES_ROUTE_PATH,
        { search: query },
      )
        .then((response) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setState({ response, isLoading: false, error: null });
          setActiveIndex(0);
        })
        .catch((error: unknown) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setState({ response: null, isLoading: false, error: readErrorText(error) });
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, isOpen]);

  const membersById = useMemo(
    () =>
      new Map(
        (state.response?.members ?? []).map((member) => [member.id, member]),
      ),
    [state.response],
  );
  const statusById = useMemo(
    () =>
      new Map(
        (state.response?.issueStatuses ?? []).map((status) => [
          status.id,
          status,
        ]),
      ),
    [state.response],
  );
  const projectById = useMemo(
    () =>
      new Map(
        (state.response?.projects ?? []).map((project) => [
          project.id,
          project,
        ]),
      ),
    [state.response],
  );

  const results = useMemo(() => {
    const issues = state.response?.issues ?? [];

    if (excludeIds === undefined || excludeIds.length === 0) {
      return issues;
    }

    return issues.filter((issue) => !excludeIds.includes(issue.id));
  }, [state.response, excludeIds]);

  // One extra reachable row when the caller accepts creation: picking it
  // creates instead of linking, so the same keystrokes cover both.
  const canCreateRow = onCreateNew !== undefined && query !== '';
  const itemCount = results.length + (canCreateRow ? 1 : 0);
  const showPopover =
    isOpen && (isFocused || isPointerOverPopover);

  const close = () => {
    setIsOpen(false);
    setIsPointerOverPopover(false);
  };

  const select = (issue: BoardIssue) => {
    close();
    onSelectIssue(issue);
  };

  return (
    <div style={{ display: 'flex', flex: 1, maxWidth, minWidth: 200 }}>
      <div
        style={{
          ...getTaskControlStyle(isFocused),
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          height: inputHeight,
          padding: '0 8px',
          width: '100%',
          ...(isSmall && {
            background: TASK_TOKENS.backgroundSecondary,
            borderRadius: TASK_TOKENS.radiusSmall,
            gap: 6,
          }),
          ...(isLarge && {
            background: TASK_TOKENS.background,
            borderColor: isFocused ? TASK_TOKENS.accent : TASK_TOKENS.borderStrong,
            boxShadow: isFocused
              ? `0 0 0 3px ${TASK_TOKENS.accentSoft}`
              : TASK_TOKENS.shadowLight,
            fontSize: 14,
            height: LARGE_INPUT_HEIGHT,
            padding: '0 12px',
          }),
        }}
      >
        <IconSearch
          size={isLarge ? 16 : isSmall ? 13 : 15}
          color={
            isLarge && isFocused ? TASK_TOKENS.accent : TASK_TOKENS.textTertiary
          }
        />
        <input
          ref={inputRef}
          aria-label={ariaLabel ?? t('Search all issues')}
          aria-expanded={showPopover}
          aria-controls="task-issue-search-results"
          role="combobox"
          aria-autocomplete="list"
          value={value}
          placeholder={placeholder ?? t('Search by key or title…')}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);

            if (value === '') {
              onDismiss?.();
            }
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && itemCount > 0) {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => (index + 1) % itemCount);
            } else if (event.key === 'ArrowUp' && itemCount > 0) {
              event.preventDefault();
              setActiveIndex((index) =>
                (index - 1 + itemCount) % itemCount,
              );
            } else if (event.key === 'Enter') {
              if (showPopover && itemCount > 0) {
                event.preventDefault();

                if (activeIndex < results.length) {
                  const picked = results[activeIndex];

                  if (picked !== undefined) {
                    select(picked);
                  }
                } else {
                  close();
                  onCreateNew?.();
                }
              } else if (query !== '') {
                // Popover closed (or query too short to search): Enter keeps
                // its plain-input meaning and creates.
                event.preventDefault();
                close();
                onCreateNew?.();
              }
            } else if (event.key === 'Escape') {
              close();
              onDismiss?.();
            }
          }}
          style={{
            ...TASK_BARE_FIELD_STYLE,
            fontSize: isLarge ? 14 : isSmall ? 12.5 : TASK_BARE_FIELD_STYLE.fontSize,
            height: '100%',
          }}
        />
        {value !== '' && (
          <button
            type="button"
            aria-label={t('Clear search')}
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            style={{
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: TASK_TOKENS.radiusExtraSmall,
              color: TASK_TOKENS.textTertiary,
              cursor: 'pointer',
              display: 'inline-flex',
              padding: 2,
            }}
          >
            <IconX size={14} />
          </button>
        )}
      </div>

      {showPopover && (
        <twenty-overlay offsetY={inputHeight + 4} onClose={close}>
          <div
            id="task-issue-search-results"
            onMouseEnter={() => setIsPointerOverPopover(true)}
            onMouseLeave={() => setIsPointerOverPopover(false)}
            role="listbox"
            aria-label={t('Issue results')}
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 380,
              overflow: 'hidden',
              // The same width as the field above it: the overlay portals to
              // the body, so no percentage can reach the field — but a numeric
              // maxWidth is the field's own width, and it doubles as the
              // popover's. Clamped to the viewport for narrow screens.
              // Never wider than the screen less a margin: on a phone the
              // fixed width overflowed and the host pushed the card off the
              // left edge, cutting the issue keys. 40px rather than 16: the
              // host zooms this subtree on phones, so vw runs a little large.
              width: `min(${
                typeof maxWidth === 'number' ? maxWidth : POPOVER_WIDTH
              }px, calc(100vw - 40px))`,
            }}
          >
            <div style={{ overflowY: 'auto', ...TASK_THIN_SCROLLBAR_STYLE, padding: 4 }}>
              {state.isLoading && results.length === 0 ? (
                <PopoverNote text={t('Searching…')} />
              ) : state.error !== null ? (
                <PopoverNote text={state.error} tone="danger" />
              ) : results.length === 0 ? (
                <PopoverNote
                  text={
                    query === ''
                      ? t('No issues yet')
                      : `${t('No issues match')} "${query}"`
                  }
                />
              ) : (
                results.map((issue, index) => {
                  const status = statusById.get(issue.statusId ?? '');
                  const project = projectById.get(issue.projectId ?? '');
                  const assigneeName =
                    typeof issue.assigneeId === 'string'
                      ? readMemberName(
                          membersById,
                          issue.assigneeId,
                          t('Unknown'),
                        )
                      : null;

                  // The small picker (adding a sub-issue) lists one issue a
                  // line, like the link picker in a conversation: in a list
                  // shown before anything is typed, three-line rows fit four
                  // candidates where this fits ten.
                  if (isSmall) {
                    return (
                      <button
                        key={issue.id}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => select(issue)}
                        style={{
                          alignItems: 'center',
                          background:
                            index === activeIndex
                              ? TASK_TOKENS.backgroundHover
                              : 'transparent',
                          border: 'none',
                          borderRadius: TASK_TOKENS.radiusSmall,
                          cursor: 'pointer',
                          display: 'flex',
                          fontFamily: TASK_TOKENS.fontFamily,
                          fontSize: 13,
                          gap: 8,
                          minHeight: 34,
                          padding: '0 8px',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <span
                          style={{
                            color: TASK_TOKENS.textTertiary,
                            flexShrink: 0,
                            fontSize: 12,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {issue.issueKey ?? ''}
                        </span>
                        <span
                          style={{
                            color: TASK_TOKENS.textPrimary,
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {issue.title ?? t('(No title)')}
                        </span>
                        {status?.name != null && (
                          <TaskTag color={status.color ?? 'gray'}>
                            {status.name}
                          </TaskTag>
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={issue.id}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(issue)}
                      style={{
                        alignItems: 'center',
                        background:
                          index === activeIndex
                            ? TASK_TOKENS.backgroundHover
                            : 'transparent',
                        border: 'none',
                        borderRadius: TASK_TOKENS.radiusSmall,
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 8,
                        minHeight: 52,
                        padding: '6px 8px',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1,
                          gap: 2,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            alignItems: 'center',
                            display: 'flex',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              color: TASK_TOKENS.textTertiary,
                              fontFamily: TASK_TOKENS.fontFamily,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: 0.3,
                            }}
                          >
                            {issue.issueKey ?? ''}
                          </span>
                          {status?.name != null && (
                            <TaskTag color={status.color ?? 'gray'}>
                              {status.name}
                            </TaskTag>
                          )}
                        </span>
                        <span
                          style={{
                            color: TASK_TOKENS.textPrimary,
                            fontFamily: TASK_TOKENS.fontFamily,
                            fontSize: 13,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {issue.title ?? t('(No title)')}
                        </span>
                        <span
                          style={{
                            alignItems: 'center',
                            color: TASK_TOKENS.textTertiary,
                            display: 'flex',
                            fontFamily: TASK_TOKENS.fontFamily,
                            fontSize: 11,
                            gap: 6,
                          }}
                        >
                          {(project?.key ?? '') !== '' && (
                            <span>{project?.key}</span>
                          )}
                          {issue.priority != null && (
                            <span
                              style={{
                                alignItems: 'center',
                                display: 'inline-flex',
                                gap: 2,
                              }}
                            >
                              <IconFlag
                                size={11}
                                color={
                                  readTagColor(
                                    priorityColor(issue.priority),
                                  ).text
                                }
                              />
                              {issue.priority}
                            </span>
                          )}
                          {typeof issue.dueDate === 'string' &&
                            issue.dueDate !== '' && (
                              <span
                                style={{
                                  alignItems: 'center',
                                  display: 'inline-flex',
                                  gap: 2,
                                }}
                              >
                                <IconCalendarEvent size={11} />
                                {readShortDate(issue.dueDate)}
                              </span>
                            )}
                          {assigneeName !== null && (
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {assigneeName}
                            </span>
                          )}
                        </span>
                      </span>
                      {typeof issue.assigneeId === 'string' && (
                        <TaskAvatar
                          name={assigneeName ?? issue.assigneeId}
                          avatarUrl={
                            membersById.get(issue.assigneeId)?.avatarUrl
                          }
                          size={24}
                        />
                      )}
                    </button>
                  );
                })
              )}
              {canCreateRow && (
                <button
                  type="button"
                  role="option"
                  aria-selected={activeIndex === results.length}
                  onMouseEnter={() => setActiveIndex(results.length)}
                  onClick={() => {
                    close();
                    onCreateNew?.();
                  }}
                  style={{
                    alignItems: 'center',
                    background:
                      activeIndex === results.length
                        ? TASK_TOKENS.backgroundHover
                        : 'transparent',
                    border: 'none',
                    borderRadius: TASK_TOKENS.radiusSmall,
                    color: TASK_TOKENS.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 13,
                    fontWeight: 600,
                    gap: 6,
                    minHeight: 32,
                    padding: '0 8px',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <IconPlus size={14} color={TASK_TOKENS.accent} />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`${t('Create')} "${query}"`}
                  </span>
                </button>
              )}
            </div>
            <div
              style={{
                alignItems: 'center',
                borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
                color: TASK_TOKENS.textTertiary,
                display: 'flex',
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 11,
                gap: 8,
                justifyContent: 'space-between',
                padding: '6px 12px',
              }}
            >
              <span>
                {state.response?.hasMore === true
                  ? t('Showing the first 50 — keep typing to narrow it down')
                  : results.length > 0
                    ? `${results.length} ${results.length === 1 ? t('result') : t('results')}`
                    : t('Across every project you can access')}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>
                {t('↑↓ navigate · Enter open · Esc close')}
              </span>
            </div>
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

const PopoverNote = ({
  text,
  tone = 'muted',
}: {
  text: string;
  tone?: 'muted' | 'danger';
}) => (
  <span
    style={{
      color:
        tone === 'danger' ? TASK_TOKENS.textDanger : TASK_TOKENS.textTertiary,
      display: 'block',
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 12,
      padding: '12px 8px',
      textAlign: 'center',
    }}
  >
    {text}
  </span>
);

// Priority arrives as the stored enum ('HIGH', …); the option catalogue it
// renders from lives behind the same values, so the colour resolves there.
const priorityColor = (priority: string): string | null => {
  const option = ISSUE_PRIORITY_OPTIONS.find(
    (candidate) => candidate.value === priority,
  );

  return option?.color ?? null;
};

const readShortDate = (value: string): string | null => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
};

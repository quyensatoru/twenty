import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconArrowsSort,
  IconArrowUp,
  IconCheck,
  IconChevronDown,
  IconPlus,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from 'twenty-ui/icon';

import {
  BOARD_ISSUE_SORT_FIELDS,
  type BoardIssueSort,
  type BoardIssueSortField,
} from '../../constants/board-issue-sorts';
import { readBoardIssueSortLabel } from '../utils/read-board-issue-sort-label.util';
import { TaskButton } from './task-button';
import { TaskIconButton } from './task-icon-button';
import { TASK_TOKENS } from './task-tokens';

type TaskBoardSortMenuProps = {
  sort: BoardIssueSort;
  canAddRule: boolean;
  onAddRule: () => void;
  onChangeRuleField: (index: number, field: BoardIssueSortField) => void;
  onToggleRuleDirection: (index: number) => void;
  onMoveRuleUp: (index: number) => void;
  onRemoveRule: (index: number) => void;
  onClearSort: () => void;
  isMobile: boolean;
  width?: number | string;
};

const TRIGGER_HEIGHT = 32;
const MOBILE_MENU_WIDTH = 320;

const readDirectionArrow = (direction: 'asc' | 'desc') =>
  direction === 'asc' ? '↑' : '↓';

const PICKER_WIDTH = 160;

// A dropdown drawn inside the sort menu's own overlay rather than through
// TaskBoardSelect: a second overlay counts as a click outside this one and
// closes the menu mid-edit.
const SortFieldPicker = ({
  value,
  options,
  isOpen,
  onToggle,
  onPick,
  isFlexible,
}: {
  // Takes the row's free width instead of a fixed one, for narrow screens.
  isFlexible: boolean;
  value: BoardIssueSortField;
  options: readonly BoardIssueSortField[];
  isOpen: boolean;
  onToggle: () => void;
  onPick: (field: BoardIssueSortField) => void;
}) => {
  const [hoveredField, setHoveredField] = useState<BoardIssueSortField | null>(
    null,
  );

  return (
    <div
      style={{
        flex: isFlexible ? 1 : undefined,
        flexShrink: isFlexible ? 1 : 0,
        minWidth: 0,
        position: 'relative',
        width: isFlexible ? 'auto' : PICKER_WIDTH,
      }}
    >
      <button
        type="button"
        aria-label={t('Sort field')}
        aria-expanded={isOpen}
        onClick={onToggle}
        style={{
          alignItems: 'center',
          background: isOpen
            ? TASK_TOKENS.backgroundHover
            : TASK_TOKENS.background,
          border: `1px solid ${isOpen ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: TASK_TOKENS.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: 500,
          height: TRIGGER_HEIGHT,
          justifyContent: 'space-between',
          padding: '0 8px',
          width: '100%',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {readBoardIssueSortLabel(value)}
        </span>
        <IconChevronDown size={14} color={TASK_TOKENS.textTertiary} />
      </button>
      {isOpen && (
        <div
          role="listbox"
          aria-label={t('Sort field')}
          style={{
            background: TASK_TOKENS.background,
            border: `1px solid ${TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radiusSmall,
            boxShadow: TASK_TOKENS.shadowStrong,
            boxSizing: 'border-box',
            left: 0,
            padding: 4,
            position: 'absolute',
            top: TRIGGER_HEIGHT + 4,
            minWidth: '100%',
            width: isFlexible ? '100%' : PICKER_WIDTH + 40,
            zIndex: 1,
          }}
        >
          {options.map((field) => (
            <button
              key={field}
              type="button"
              role="option"
              aria-selected={field === value}
              onMouseEnter={() => setHoveredField(field)}
              onMouseLeave={() => setHoveredField(null)}
              onClick={() => onPick(field)}
              style={{
                alignItems: 'center',
                background:
                  hoveredField === field
                    ? TASK_TOKENS.backgroundHover
                    : 'transparent',
                border: 'none',
                borderRadius: TASK_TOKENS.radiusSmall,
                color: TASK_TOKENS.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 13,
                justifyContent: 'space-between',
                minHeight: 32,
                padding: '0 8px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {readBoardIssueSortLabel(field)}
              {field === value && (
                <IconCheck size={14} color={TASK_TOKENS.accent} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const TaskBoardSortMenu = ({
  sort,
  canAddRule,
  onAddRule,
  onChangeRuleField,
  onToggleRuleDirection,
  onMoveRuleUp,
  onRemoveRule,
  onClearSort,
  isMobile,
  width,
}: TaskBoardSortMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);
  const summary = sort
    .map(
      (rule) =>
        `${readBoardIssueSortLabel(rule.field)} ${readDirectionArrow(rule.direction)}`,
    )
    .join(', ');

  return (
    <div
      style={{
        display: 'inline-flex',
        maxWidth: '100%',
        position: 'relative',
        width: width ?? 'auto',
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        title={summary === '' ? undefined : summary}
        onClick={() => setIsOpen((current) => !current)}
        style={{
          alignItems: 'center',
          background:
            sort.length > 0 ? TASK_TOKENS.accentSoft : TASK_TOKENS.background,
          border: `1px solid ${
            isOpen || sort.length > 0 ? TASK_TOKENS.accent : TASK_TOKENS.border
          }`,
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: sort.length > 0 ? TASK_TOKENS.accent : TASK_TOKENS.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: 500,
          gap: 6,
          height: TRIGGER_HEIGHT,
          maxWidth: isMobile ? '100%' : 380,
          minWidth: 0,
          padding: '0 10px',
          width: '100%',
        }}
      >
        <IconArrowsSort size={14} style={{ flexShrink: 0 }} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sort.length === 0
            ? t('Sort')
            : isMobile
              ? `${t('Sort')} · ${sort.length}`
              : `${t('Sort')}: ${summary}`}
        </span>
      </button>

      {isOpen && (
        <twenty-overlay
          offsetY={TRIGGER_HEIGHT + 4}
          onClose={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-label={t('Sort')}
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: TASK_TOKENS.fontFamily,
              gap: isMobile ? 14 : 10,
              padding: 12,
              // Not a vw width: the host zooms the page on phones, and vw does
              // not follow the zoom, so it would overflow the screen.
              width: isMobile ? MOBILE_MENU_WIDTH : 480,
            }}
          >
            {sort.length === 0 ? (
              <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
                {t(
                  'Newest cards come first, after pinned ones. Add a sort to reorder them.',
                )}
              </span>
            ) : (
              sort.map((rule, index) => {
                const availableFields = BOARD_ISSUE_SORT_FIELDS.filter(
                  (field) =>
                    field === rule.field ||
                    !sort.some((other) => other.field === field),
                );

                return (
                  // Keyed by everything the row shows: the host keeps a
                  // button's first click handler, so a row reused after a
                  // move would act on the index it was first given.
                  <div
                    key={`${index}:${rule.field}:${rule.direction}`}
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: isMobile ? 6 : 8,
                    }}
                  >
                    <span
                      style={{
                        color: TASK_TOKENS.textTertiary,
                        flexBasis: isMobile ? '100%' : 'auto',
                        flexShrink: 0,
                        fontSize: isMobile ? 12 : 13,
                        minWidth: isMobile ? 0 : 88,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {index === 0 ? t('Sort by') : t('then by')}
                    </span>
                    <SortFieldPicker
                      isFlexible={isMobile}
                      value={rule.field}
                      options={availableFields}
                      isOpen={pickingIndex === index}
                      onToggle={() =>
                        setPickingIndex((current) =>
                          current === index ? null : index,
                        )
                      }
                      onPick={(field) => {
                        setPickingIndex(null);
                        onChangeRuleField(index, field);
                      }}
                    />
                    <TaskButton
                      title={
                        rule.direction === 'asc'
                          ? t('Ascending')
                          : t('Descending')
                      }
                      onClick={() => onToggleRuleDirection(index)}
                    >
                      {rule.direction === 'asc' ? (
                        <IconSortAscending size={14} />
                      ) : (
                        <IconSortDescending size={14} />
                      )}
                      {!isMobile &&
                        (rule.direction === 'asc'
                          ? t('Ascending')
                          : t('Descending'))}
                    </TaskButton>
                    {!isMobile && <span style={{ flex: 1 }} />}
                    {index > 0 && (
                      <TaskIconButton
                        label={t('Move up')}
                        onClick={() => onMoveRuleUp(index)}
                      >
                        <IconArrowUp size={14} />
                      </TaskIconButton>
                    )}
                    <TaskIconButton
                      label={t('Remove sort')}
                      onClick={() => onRemoveRule(index)}
                    >
                      <IconX size={14} />
                    </TaskIconButton>
                  </div>
                );
              })
            )}
            <div
              style={{
                alignItems: 'center',
                borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
                display: 'flex',
                gap: 6,
                justifyContent: 'space-between',
                paddingTop: 8,
              }}
            >
              <TaskButton
                variant="ghost"
                isDisabled={!canAddRule}
                onClick={onAddRule}
              >
                <IconPlus size={14} />
                {t('Add sort')}
              </TaskButton>
              {sort.length > 0 && (
                <TaskButton variant="ghost" onClick={onClearSort}>
                  {t('Clear sort')}
                </TaskButton>
              )}
            </div>
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

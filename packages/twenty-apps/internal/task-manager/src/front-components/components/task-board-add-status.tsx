import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconPlus } from 'twenty-ui/icon';

import { ISSUE_STATUS_CATEGORY_OPTIONS } from '../../constants/issue-status-category-options';
import { ISSUE_STATUS_COLOR_OPTIONS } from '../../constants/issue-status-color-options';
import {
  DEFAULT_ISSUE_STATUS_COLOR_BY_CATEGORY,
  type IssueStatusCategory,
} from '../../utils/read-new-issue-status-input.util';
import { readColorLabel } from '../utils/read-color-label.util';
import { TaskButton } from './task-button';
import { TaskTextInput } from './task-text-input';
import { readTagColor, TASK_CIRCLE_STYLE, TASK_TOKENS } from './task-tokens';

type TaskBoardAddStatusProps = {
  onCreate: (input: {
    name: string;
    category: IssueStatusCategory;
    color: string;
  }) => Promise<boolean>;
};

// Written as literals inside t() because the extractor only sees literals.
const readCategoryLabel = (category: IssueStatusCategory): string => {
  switch (category) {
    case 'UNSTARTED':
      return t('Unstarted');
    case 'STARTED':
      return t('Started');
    case 'DONE':
      return t('Done');
  }
};

// Jira's "+" after the last column: a square button that opens a small form
// for the new column's name and category. The category is asked for, not
// guessed, because it decides which columns count as done on the board.
export const TaskBoardAddStatus = ({ onCreate }: TaskBoardAddStatusProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IssueStatusCategory>('UNSTARTED');
  // Null until a swatch is picked: the colour follows the category, the way
  // the default statuses are coloured, and stops following it once chosen.
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const color = pickedColor ?? DEFAULT_ISSUE_STATUS_COLOR_BY_CATEGORY[category];

  const close = () => {
    setIsOpen(false);
    setName('');
    setCategory('UNSTARTED');
    setPickedColor(null);
  };

  const create = async () => {
    if (name.trim() === '' || isCreating) {
      return;
    }

    setIsCreating(true);

    const isCreated = await onCreate({ name: name.trim(), category, color });

    setIsCreating(false);

    if (isCreated) {
      close();
    }
  };

  return (
    <span style={{ display: 'inline-flex', flexShrink: 0, position: 'relative' }}>
      <button
        type="button"
        title={t('Add status')}
        aria-label={t('Add status')}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          alignItems: 'center',
          background:
            isOpen || isHovered
              ? TASK_TOKENS.backgroundTertiary
              : TASK_TOKENS.backgroundSecondary,
          border: `1px solid ${TASK_TOKENS.borderLight}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: TASK_TOKENS.textSecondary,
          cursor: 'pointer',
          display: 'inline-flex',
          height: 32,
          justifyContent: 'center',
          padding: 0,
          width: 32,
        }}
      >
        <IconPlus size={16} />
      </button>
      {isOpen && (
        <twenty-overlay offsetX={-232} offsetY={36} onClose={close}>
          <div
            role="dialog"
            aria-label={t('Add status')}
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: TASK_TOKENS.fontFamily,
              gap: 10,
              padding: 12,
              width: 264,
            }}
          >
            <TaskTextInput
              value={name}
              onChange={setName}
              ariaLabel={t('Status name')}
              placeholder={t('Status name')}
              onEnter={() => void create()}
              onEscape={close}
              shouldAutoFocus
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  color: TASK_TOKENS.textTertiary,
                  fontSize: 11,
                  padding: '0 2px',
                }}
              >
                {t('Category')}
              </span>
              <div role="radiogroup" style={{ display: 'flex', gap: 4 }}>
                {ISSUE_STATUS_CATEGORY_OPTIONS.map((option) => {
                  const isSelected = option.value === category;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setCategory(option.value)}
                      style={{
                        alignItems: 'center',
                        background: isSelected
                          ? TASK_TOKENS.accentSoft
                          : 'transparent',
                        border: `1px solid ${isSelected ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
                        borderRadius: TASK_TOKENS.radiusSmall,
                        color: isSelected
                          ? TASK_TOKENS.textPrimary
                          : TASK_TOKENS.textSecondary,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        flex: 1,
                        fontFamily: TASK_TOKENS.fontFamily,
                        fontSize: 12,
                        gap: 6,
                        height: 28,
                        justifyContent: 'center',
                        padding: '0 6px',
                      }}
                    >
                      <span
                        style={{
                          background: readTagColor(option.color).text,
                          ...TASK_CIRCLE_STYLE,
                          flexShrink: 0,
                          height: 6,
                          width: 6,
                        }}
                      />
                      {readCategoryLabel(option.value)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  color: TASK_TOKENS.textTertiary,
                  fontSize: 11,
                  padding: '0 2px',
                }}
              >
                {t('Color')}
              </span>
              <div
                role="radiogroup"
                aria-label={t('Color')}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}
              >
                {ISSUE_STATUS_COLOR_OPTIONS.map((option) => {
                  const isSelected = option.value === color;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={readColorLabel(option.color)}
                      title={readColorLabel(option.color)}
                      onClick={() => setPickedColor(option.value)}
                      style={{
                        alignItems: 'center',
                        background: 'transparent',
                        border: `2px solid ${isSelected ? readTagColor(option.color).text : 'transparent'}`,
                        ...TASK_CIRCLE_STYLE,
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        height: 22,
                        justifyContent: 'center',
                        padding: 0,
                        width: 22,
                      }}
                    >
                      <span
                        style={{
                          background: readTagColor(option.color).text,
                          ...TASK_CIRCLE_STYLE,
                          height: 14,
                          width: 14,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <TaskButton size="small" onClick={close}>
                {t('Cancel')}
              </TaskButton>
              <TaskButton
                variant="primary"
                size="small"
                isDisabled={name.trim() === '' || isCreating}
                onClick={() => void create()}
              >
                {t('Create')}
              </TaskButton>
            </div>
          </div>
        </twenty-overlay>
      )}
    </span>
  );
};

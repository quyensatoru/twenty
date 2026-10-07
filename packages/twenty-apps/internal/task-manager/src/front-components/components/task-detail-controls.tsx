import { type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { ISSUE_LABEL_OPTIONS } from '../../constants/issue-label-options';
import { TaskCheckbox } from './task-checkbox';
import { TaskTag } from './task-tag';
import { TaskTextInput } from './task-text-input';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

// A Details value as Twenty draws one: no box on the row, just the value over
// a tint on hover. Clicking swaps in the real editor (a TaskTextInput, the due
// date picker), so the panel reads like the host's own field
// list instead of a column of browser boxes.
export const DetailReadButton = ({
  label,
  children,
  onOpen,
  isReadOnly = false,
}: {
  label: string;
  children: ReactNode;
  onOpen: () => void;
  isReadOnly?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      title={isReadOnly ? undefined : label}
      aria-label={label}
      aria-readonly={isReadOnly}
      disabled={isReadOnly}
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background:
          isHovered && !isReadOnly ? TASK_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radius,
        color: TASK_TOKENS.textPrimary,
        cursor: isReadOnly ? 'default' : 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        minHeight: 24,
        minWidth: 0,
        overflow: 'hidden',
        padding: '0 4px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {children}
    </button>
  );
};

// Labels are a multi-select, and no shared multi picker exists —
// TaskRelationSelect is single-valued — so the Details panel owns this small
// checkbox dropdown. Options come from the app's label catalogue, so a label
// stays spelled and coloured the same everywhere.
export const LabelPicker = ({
  selected,
  isOpen,
  onOpenChange,
  onChange,
  overlayOffsetX = -4,
  isReadOnly = false,
}: {
  selected: string[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChange: (labels: string[]) => void;
  overlayOffsetX?: number;
  isReadOnly?: boolean;
}) => {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const matches = ISSUE_LABEL_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(term),
  );

  return (
    <div style={{ minWidth: 0, width: '100%' }}>
      <button
        type="button"
        aria-label={t('Labels')}
        aria-expanded={isOpen}
        aria-readonly={isReadOnly}
        disabled={isReadOnly}
        onClick={() => onOpenChange(!isOpen)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radius,
          cursor: isReadOnly ? 'default' : 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          minHeight: 24,
          padding: '0 4px',
          textAlign: 'left',
          width: '100%',
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: TASK_TOKENS.textLight, fontSize: 13 }}>
            {t('Labels')}
          </span>
        ) : (
          selected.map((value) => {
            const option = ISSUE_LABEL_OPTIONS.find(
              (candidate) => candidate.value === value,
            );

            return (
              <TaskTag key={value} color={option?.color ?? 'gray'}>
                {option?.label ?? value}
              </TaskTag>
            );
          })
        )}
      </button>
      {isOpen && !isReadOnly && (
        <twenty-overlay offsetY={-4} offsetX={overlayOffsetX} onClose={() => onOpenChange(false)}>
          <div
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.borderLight}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              width: 202,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                padding: 8,
              }}
            >
              <TaskTextInput
                ariaLabel={t('Search labels')}
                placeholder={t('Search')}
                value={search}
                onChange={setSearch}
              />
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto', ...TASK_THIN_SCROLLBAR_STYLE, padding: 4 }}>
              {matches.map((option) => {
                const isChecked = selected.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() =>
                      onChange(
                        isChecked
                          ? selected.filter((value) => value !== option.value)
                          : [...selected, option.value],
                      )
                    }
                    style={{
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: TASK_TOKENS.radiusSmall,
                      cursor: 'pointer',
                      display: 'flex',
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 13,
                      gap: 8,
                      minHeight: 32,
                      padding: '0 6px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <TaskCheckbox isChecked={isChecked} />
                    <TaskTag color={option.color}>{option.label}</TaskTag>
                  </button>
                );
              })}
            </div>
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

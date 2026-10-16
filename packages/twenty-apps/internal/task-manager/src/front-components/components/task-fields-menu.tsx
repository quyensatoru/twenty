import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconAdjustments, IconSettings } from 'twenty-ui/icon';

import { type IssueDetailFieldKey } from '../../constants/issue-view-fields';
import { readIssueFieldLabel } from '../utils/read-issue-field-label.util';
import { TaskCheckbox } from './task-checkbox';
import { TaskIconButton } from './task-icon-button';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

type TaskFieldsMenuProps<TFieldKey extends IssueDetailFieldKey> = {
  label: string;
  fields: readonly { key: TFieldKey }[];
  hiddenFields: readonly TFieldKey[];
  onHiddenFieldsChange: (hiddenFields: TFieldKey[]) => void;
  offsetX?: number;
  // Draws a labelled toolbar button instead of the bare gear.
  buttonLabel?: string;
};

export const TaskFieldsMenu = <TFieldKey extends IssueDetailFieldKey>({
  label,
  fields,
  hiddenFields,
  onHiddenFieldsChange,
  offsetX = -180,
  buttonLabel,
}: TaskFieldsMenuProps<TFieldKey>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);

  const toggleField = (key: TFieldKey) =>
    onHiddenFieldsChange(
      hiddenFields.includes(key)
        ? hiddenFields.filter((hidden) => hidden !== key)
        : [...hiddenFields, key],
    );

  return (
    <span style={{ display: 'inline-flex', position: 'relative' }}>
      {buttonLabel === undefined ? (
        <TaskIconButton label={label} onClick={() => setIsOpen(!isOpen)}>
          <IconSettings size={16} />
        </TaskIconButton>
      ) : (
        <button
          type="button"
          aria-label={label}
          title={label}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsTriggerHovered(true)}
          onMouseLeave={() => setIsTriggerHovered(false)}
          style={{
            alignItems: 'center',
            background:
              isOpen || isTriggerHovered
                ? TASK_TOKENS.backgroundHover
                : 'transparent',
            border: 'none',
            borderRadius: TASK_TOKENS.radiusSmall,
            color: TASK_TOKENS.textSecondary,
            cursor: 'pointer',
            display: 'inline-flex',
            flexShrink: 0,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 500,
            gap: 6,
            height: 28,
            padding: '0 8px',
          }}
        >
          <IconAdjustments size={14} />
          {buttonLabel}
        </button>
      )}
      {isOpen && (
        <twenty-overlay
          offsetX={offsetX}
          offsetY={buttonLabel === undefined ? 28 : 32}
          onClose={() => setIsOpen(false)}
        >
          <div
            role="menu"
            aria-label={label}
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              maxHeight: 360,
              overflowY: 'auto',
              ...TASK_THIN_SCROLLBAR_STYLE,
              padding: 4,
              width: 208,
            }}
          >
            <span
              style={{
                color: TASK_TOKENS.textTertiary,
                display: 'block',
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 11,
                padding: '6px 8px 4px 8px',
              }}
            >
              {t('Shown for everyone on this project')}
            </span>
            {fields.map((field) => {
              const isFieldShown = !hiddenFields.includes(field.key);

              return (
                <button
                  key={field.key}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={isFieldShown}
                  onClick={() => toggleField(field.key)}
                  style={{
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: TASK_TOKENS.radiusSmall,
                    color: TASK_TOKENS.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 13,
                    gap: 8,
                    minHeight: 32,
                    padding: '0 8px',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <TaskCheckbox isChecked={isFieldShown} />
                  {readIssueFieldLabel(field.key)}
                </button>
              );
            })}
          </div>
        </twenty-overlay>
      )}
    </span>
  );
};

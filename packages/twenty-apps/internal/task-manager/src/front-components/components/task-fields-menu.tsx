import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconSettings } from 'twenty-ui/icon';

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
};

export const TaskFieldsMenu = <TFieldKey extends IssueDetailFieldKey>({
  label,
  fields,
  hiddenFields,
  onHiddenFieldsChange,
  offsetX = -180,
}: TaskFieldsMenuProps<TFieldKey>) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleField = (key: TFieldKey) =>
    onHiddenFieldsChange(
      hiddenFields.includes(key)
        ? hiddenFields.filter((hidden) => hidden !== key)
        : [...hiddenFields, key],
    );

  return (
    <span style={{ display: 'inline-flex', position: 'relative' }}>
      <TaskIconButton label={label} onClick={() => setIsOpen(!isOpen)}>
        <IconSettings size={16} />
      </TaskIconButton>
      {isOpen && (
        <twenty-overlay
          offsetX={offsetX}
          offsetY={28}
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

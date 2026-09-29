import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconSettings } from 'twenty-ui/icon';

import {
  ISSUE_CARD_FIELDS,
  type IssueCardFieldName,
} from '../../constants/issue-card-fields';
import { TASK_TOKENS } from './task-tokens';

type TaskFieldVisibilityMenuProps = {
  visibleFields: IssueCardFieldName[];
  onToggleField: (fieldName: IssueCardFieldName) => void;
};

// Replaces the field-visibility control the fork got from the host's view bar.
// A front component cannot drive that bar, so the board carries its own.
export const TaskFieldVisibilityMenu = ({
  visibleFields,
  onToggleField,
}: TaskFieldVisibilityMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={t('Fields')}
        aria-expanded={isOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          alignItems: 'center',
          background:
            isOpen || isHovered ? TASK_TOKENS.backgroundHover : TASK_TOKENS.background,
          border: `1px solid ${isOpen ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          color: TASK_TOKENS.textSecondary,
          cursor: 'pointer',
          display: 'inline-flex',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: 500,
          gap: 6,
          height: 32,
          padding: '0 8px',
          whiteSpace: 'nowrap',
        }}
      >
        <IconSettings size={14} color={TASK_TOKENS.textTertiary} />
        {t('Fields')}
      </button>
      {isOpen ? (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ inset: 0, position: 'fixed', zIndex: 20 }}
          />
          <div
            role="menu"
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              minWidth: 200,
              padding: 4,
              position: 'absolute',
              right: 0,
              top: 36,
              zIndex: 21,
            }}
          >
            {ISSUE_CARD_FIELDS.map((field) => {
              const isVisible = visibleFields.includes(field.value);

              return (
                <button
                  key={field.value}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={isVisible}
                  onMouseEnter={() => setHoveredField(field.value)}
                  onMouseLeave={() => setHoveredField(null)}
                  onClick={() => onToggleField(field.value)}
                  style={{
                    alignItems: 'center',
                    background:
                      hoveredField === field.value
                        ? TASK_TOKENS.backgroundHover
                        : 'transparent',
                    border: 'none',
                    borderRadius: TASK_TOKENS.radiusSmall,
                    color: TASK_TOKENS.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 13,
                    gap: 8,
                    height: 32,
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span>{t(field.label)}</span>
                  {isVisible ? (
                    <IconCheck size={14} color={TASK_TOKENS.accent} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
};

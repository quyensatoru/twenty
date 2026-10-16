import { type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconDotsVertical } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

export type TaskFeedMoreMenuItem = {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  isDanger?: boolean;
  // Asks twice: the first click swaps the label for this one, the second acts.
  confirmLabel?: string;
};

type TaskFeedMoreMenuProps = {
  items: readonly TaskFeedMoreMenuItem[];
  isDisabled?: boolean;
  // The row keeps its hover-only buttons shown while this is open: the menu
  // is drawn by the host outside the row, so the pointer leaves the row to
  // reach it.
  onOpenChange?: (isOpen: boolean) => void;
};

const MENU_WIDTH = 200;

// The ⋯ under a comment or worklog: the actions used too rarely to sit in the
// row itself.
export const TaskFeedMoreMenu = ({
  items,
  isDisabled = false,
  onOpenChange,
}: TaskFeedMoreMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  const changeOpen = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);
    setConfirmingKey(null);
    onOpenChange?.(nextIsOpen);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <span
      style={{ display: 'inline-flex', flexShrink: 0, position: 'relative' }}
    >
      <button
        type="button"
        aria-label={t('More actions')}
        title={t('More actions')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => changeOpen(!isOpen)}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
        style={{
          alignItems: 'center',
          background:
            isOpen || (isTriggerHovered && !isDisabled)
              ? TASK_TOKENS.backgroundHover
              : 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radiusSmall,
          color: isOpen ? TASK_TOKENS.textPrimary : TASK_TOKENS.textTertiary,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          height: 24,
          justifyContent: 'center',
          opacity: isDisabled ? 0.35 : 1,
          padding: 0,
          width: 24,
        }}
      >
        <IconDotsVertical size={14} />
      </button>
      {isOpen && (
        <twenty-overlay offsetY={28} onClose={() => changeOpen(false)}>
          <div
            role="menu"
            aria-label={t('More actions')}
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              padding: 4,
              width: MENU_WIDTH,
            }}
          >
            {items.map((item) => {
              const isConfirming = confirmingKey === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() => {
                    if (item.confirmLabel !== undefined && !isConfirming) {
                      setConfirmingKey(item.key);

                      return;
                    }

                    changeOpen(false);
                    item.onSelect();
                  }}
                  style={{
                    alignItems: 'center',
                    background: isConfirming
                      ? TASK_TOKENS.red
                      : hoveredKey === item.key
                        ? TASK_TOKENS.backgroundHover
                        : 'transparent',
                    border: 'none',
                    borderRadius: TASK_TOKENS.radiusSmall,
                    color: isConfirming
                      ? TASK_TOKENS.textInverted
                      : item.isDanger === true
                        ? TASK_TOKENS.textDanger
                        : TASK_TOKENS.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 13,
                    fontWeight: isConfirming ? 600 : 400,
                    gap: 8,
                    minHeight: 32,
                    padding: '0 8px',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>
                    {isConfirming ? item.confirmLabel : item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </twenty-overlay>
      )}
    </span>
  );
};

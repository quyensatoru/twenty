import { useState } from 'react';
import { IconDotsVertical } from 'twenty-ui/icon';

import {
  readTagColor,
  TASK_CIRCLE_STYLE,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';

export type TaskActionMenuItem = {
  key: string;
  label: string;
  onSelect: () => void;
  isDanger?: boolean;
  // A destructive item asks twice, the way the card menu does: the first
  // click swaps its label for this one, the second acts.
  confirmLabel?: string;
  // A colour dot before the label, for colour pickers.
  color?: string;
  isSelected?: boolean;
};

type TaskActionMenuProps = {
  label: string;
  items: readonly TaskActionMenuItem[];
};

// The "..." menu of a sprint or an epic row.
export const TaskActionMenu = ({ label, items }: TaskActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  const close = () => {
    setIsOpen(false);
    setConfirmingKey(null);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <span style={{ display: 'inline-flex', flexShrink: 0, position: 'relative' }}>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          alignItems: 'center',
          background: isOpen ? TASK_TOKENS.backgroundHover : 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radiusExtraSmall,
          cursor: 'pointer',
          display: 'inline-flex',
          padding: 4,
        }}
      >
        <IconDotsVertical size={14} color={TASK_TOKENS.textTertiary} />
      </button>
      {isOpen && (
        <twenty-overlay offsetX={-220} offsetY={24} onClose={close}>
          <div
            role="menu"
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              maxHeight: 320,
              overflowY: 'auto',
              ...TASK_THIN_SCROLLBAR_STYLE,
              padding: 4,
              width: 240,
            }}
          >
            {items.map((item) => {
              const isConfirming = confirmingKey === item.key;
              const isHovered = hoveredKey === item.key;

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

                    close();
                    item.onSelect();
                  }}
                  style={{
                    alignItems: 'center',
                    background: isConfirming
                      ? TASK_TOKENS.red
                      : isHovered
                        ? TASK_TOKENS.backgroundHover
                        : 'transparent',
                    border: 'none',
                    borderRadius: TASK_TOKENS.radiusSmall,
                    color: isConfirming
                      ? '#ffffff'
                      : item.isDanger === true
                        ? TASK_TOKENS.textDanger
                        : TASK_TOKENS.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 13,
                    fontWeight: isConfirming || item.isSelected === true ? 600 : 400,
                    gap: 8,
                    minHeight: 32,
                    padding: '0 8px',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {item.color !== undefined && (
                    <span
                      style={{
                        background: readTagColor(item.color).text,
                        ...TASK_CIRCLE_STYLE,
                        flexShrink: 0,
                        height: 10,
                        width: 10,
                      }}
                    />
                  )}
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      padding: isConfirming ? '6px 0' : 0,
                      textOverflow: 'ellipsis',
                      // The confirmation says what the delete takes with it,
                      // so it wraps rather than hiding the end of it.
                      whiteSpace: isConfirming ? 'normal' : 'nowrap',
                    }}
                  >
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

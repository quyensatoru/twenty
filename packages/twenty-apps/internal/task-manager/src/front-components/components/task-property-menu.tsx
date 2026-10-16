import { type ReactNode, useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconSearch } from 'twenty-ui/icon';

import { TASK_BARE_FIELD_STYLE } from './task-control-styles';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

export type TaskPropertyMenuOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type TaskPropertyMenuProps = {
  label: string;
  // What the trigger shows: the current value's glyph, an avatar.
  trigger: ReactNode;
  options: readonly TaskPropertyMenuOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  isDisabled?: boolean;
  triggerSize?: number;
  offsetX?: number;
};

const MENU_WIDTH = 220;
const SEARCH_THRESHOLD = 7;

// Change one property in place, from a list or a card, without opening the
// issue. The trigger is a sibling of the row's open button rather than a
// child of it: the sandbox does not forward stopPropagation, so a nested
// button would open the issue too.
export const TaskPropertyMenu = ({
  label,
  trigger,
  options,
  selectedValue,
  onSelect,
  isDisabled = false,
  triggerSize = 24,
  offsetX = -8,
}: TaskPropertyMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();

    return term === ''
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, search]);

  const close = () => {
    setIsOpen(false);
    setSearch('');
    setHoveredValue(null);
  };

  return (
    <span style={{ display: 'inline-flex', flexShrink: 0, position: 'relative' }}>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
        style={{
          alignItems: 'center',
          background:
            !isDisabled && (isOpen || isTriggerHovered)
              ? TASK_TOKENS.backgroundSelected
              : 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radiusSmall,
          cursor: isDisabled ? 'default' : 'pointer',
          display: 'inline-flex',
          height: triggerSize,
          justifyContent: 'center',
          minWidth: triggerSize,
          padding: 0,
        }}
      >
        {trigger}
      </button>
      {isOpen && (
        <twenty-overlay
          offsetX={offsetX}
          offsetY={triggerSize + 4}
          onClose={close}
        >
          <div
            role="menu"
            aria-label={label}
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radius,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              width: MENU_WIDTH,
            }}
          >
            {options.length >= SEARCH_THRESHOLD && (
              <div
                style={{
                  alignItems: 'center',
                  borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                  display: 'flex',
                  gap: 6,
                  height: 34,
                  padding: '0 8px',
                }}
              >
                <IconSearch size={14} color={TASK_TOKENS.textTertiary} />
                <input
                  aria-label={label}
                  value={search}
                  placeholder={label}
                  onChange={(event) => setSearch(event.target.value)}
                  style={TASK_BARE_FIELD_STYLE}
                />
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 280,
                overflowY: 'auto',
                ...TASK_THIN_SCROLLBAR_STYLE,
                padding: 4,
              }}
            >
              {matches.length === 0 ? (
                <span
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 12,
                    padding: 8,
                  }}
                >
                  {t('No result')}
                </span>
              ) : (
                matches.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={option.value === selectedValue}
                    onMouseEnter={() => setHoveredValue(option.value)}
                    onMouseLeave={() => setHoveredValue(null)}
                    onClick={() => {
                      close();

                      if (option.value !== selectedValue) {
                        onSelect(option.value);
                      }
                    }}
                    style={{
                      alignItems: 'center',
                      background:
                        hoveredValue === option.value
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
                      minHeight: 30,
                      padding: '0 8px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    {option.icon !== undefined && (
                      <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                        {option.icon}
                      </span>
                    )}
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.label}
                    </span>
                    {option.value === selectedValue && (
                      <IconCheck size={14} color={TASK_TOKENS.accent} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </twenty-overlay>
      )}
    </span>
  );
};

import { type ReactNode, useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconChevronDown, IconSearch } from 'twenty-ui/icon';

import { TASK_BARE_FIELD_STYLE } from './task-control-styles';
import {
  readTagColor,
  TASK_CIRCLE_STYLE,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';

export type TaskBoardSelectOption = {
  value: string;
  label: string;
  color?: string | null;
  icon?: ReactNode;
};

type TaskBoardSelectProps = {
  value: string;
  options: readonly TaskBoardSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  width?: number | string;
  isDisabled?: boolean;
  // `ghost` is the borderless trigger a toolbar uses (the project switcher);
  // `field` is the bordered one that sits in a form row.
  variant?: 'field' | 'ghost';
  // Drawn before the selected label, in place of the option's own dot.
  triggerIcon?: ReactNode;
};

const TRIGGER_HEIGHT = 32;
const CARD_WIDTH = 240;
const OPTIONS_MAX_HEIGHT = 280;

// The board header's pickers: project, sprint, assignee, type. Drawn here
// rather than reusing TaskSelect because the board lists are long enough to
// need a search box, and TaskSelect has none — and rather than importing a
// host select, which an app cannot style and which renders the operating
// system's own widget. Opens through the host's <twenty-overlay> like every
// other dropdown in this app, because a widget clips whatever it contains.
const GHOST_TRIGGER_PADDING_LEFT = 4;

// A ghost trigger leading a toolbar pulls left by this much so its icon sits
// on the page edge, like the rows under it.
export const GHOST_TRIGGER_LEADING_OFFSET = GHOST_TRIGGER_PADDING_LEFT + 1;

export const TaskBoardSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  width = 180,
  isDisabled = false,
  variant = 'field',
  triggerIcon,
}: TaskBoardSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const isGhost = variant === 'ghost';
  const [search, setSearch] = useState('');
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (term === '') {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, search]);

  const close = () => {
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        maxWidth: '100%',
        minWidth: 0,
        position: 'relative',
        width,
      }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
        style={{
          alignItems: 'center',
          background:
            isOpen || (isGhost && isTriggerHovered)
              ? TASK_TOKENS.backgroundHover
              : isGhost
                ? 'transparent'
                : TASK_TOKENS.background,
          border: isGhost
            ? '1px solid transparent'
            : `1px solid ${isOpen ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: TASK_TOKENS.textPrimary,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: isGhost ? 600 : 500,
          gap: 6,
          height: TRIGGER_HEIGHT,
          justifyContent: isGhost ? 'flex-start' : 'space-between',
          opacity: isDisabled ? 0.5 : 1,
          padding: isGhost
            ? `0 6px 0 ${GHOST_TRIGGER_PADDING_LEFT}px`
            : '0 8px',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 6,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {triggerIcon ?? selected?.icon}
          {triggerIcon === undefined &&
            selected?.icon === undefined &&
            selected?.color !== undefined &&
            selected?.color !== null && (
            <span
              style={{
                background: readTagColor(selected.color).text,
                ...TASK_CIRCLE_STYLE,
                flexShrink: 0,
                height: 8,
                width: 8,
              }}
            />
          )}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selected?.label ?? placeholder ?? ''}
          </span>
        </span>
        <IconChevronDown size={14} color={TASK_TOKENS.textTertiary} />
      </button>

      {isOpen && (
        <twenty-overlay offsetY={TRIGGER_HEIGHT + 4} onClose={close}>
          <div
            role="listbox"
            aria-label={ariaLabel}
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              width: CARD_WIDTH,
            }}
          >
            <div
              style={{
                alignItems: 'center',
                borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                display: 'flex',
                gap: 6,
                height: 36,
                padding: '0 8px',
              }}
            >
              <IconSearch size={14} color={TASK_TOKENS.textTertiary} />
              <input
                aria-label={t('Search')}
                value={search}
                placeholder={t('Search')}
                onChange={(event) => setSearch(event.target.value)}
                style={TASK_BARE_FIELD_STYLE}
              />
            </div>
            <div style={{ maxHeight: OPTIONS_MAX_HEIGHT, overflowY: 'auto', ...TASK_THIN_SCROLLBAR_STYLE, padding: 4 }}>
              {matches.length === 0 ? (
                <span
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    display: 'block',
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 12,
                    padding: 6,
                  }}
                >
                  {t('No result')}
                </span>
              ) : (
                matches.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onMouseEnter={() => setHoveredValue(option.value)}
                    onMouseLeave={() => setHoveredValue(null)}
                    onClick={() => {
                      onChange(option.value);
                      close();
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
                      justifyContent: 'space-between',
                      minHeight: 32,
                      padding: '0 8px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        alignItems: 'center',
                        display: 'inline-flex',
                        gap: 6,
                        minWidth: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {option.icon}
                      {option.icon === undefined &&
                        option.color !== undefined &&
                        option.color !== null && (
                        <span
                          style={{
                            background: readTagColor(option.color).text,
                            ...TASK_CIRCLE_STYLE,
                            flexShrink: 0,
                            height: 8,
                            width: 8,
                          }}
                        />
                      )}
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {option.label}
                      </span>
                    </span>
                    {option.value === value && (
                      <IconCheck size={14} color={TASK_TOKENS.accent} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

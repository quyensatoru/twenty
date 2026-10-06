import { useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconChevronDown, IconSearch } from 'twenty-ui/icon';

import { TASK_BARE_FIELD_STYLE } from './task-control-styles';
import { readTagColor, TASK_TOKENS } from './task-tokens';

export type TaskBoardSelectOption = {
  value: string;
  label: string;
  color?: string | null;
};

type TaskBoardSelectProps = {
  value: string;
  options: readonly TaskBoardSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  width?: number | string;
  isDisabled?: boolean;
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
export const TaskBoardSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  width = 180,
  isDisabled = false,
}: TaskBoardSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
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
    <div style={{ display: 'inline-flex', position: 'relative', width }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        style={{
          alignItems: 'center',
          background: isOpen
            ? TASK_TOKENS.backgroundHover
            : TASK_TOKENS.background,
          border: `1px solid ${isOpen ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: TASK_TOKENS.textPrimary,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: 500,
          gap: 6,
          height: TRIGGER_HEIGHT,
          justifyContent: 'space-between',
          opacity: isDisabled ? 0.5 : 1,
          padding: '0 8px',
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
          {selected?.color !== undefined && selected?.color !== null && (
            <span
              style={{
                background: readTagColor(selected.color).text,
                borderRadius: '50%',
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
            <div style={{ maxHeight: OPTIONS_MAX_HEIGHT, overflowY: 'auto', padding: 4 }}>
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
                      {option.color !== undefined && option.color !== null && (
                        <span
                          style={{
                            background: readTagColor(option.color).text,
                            borderRadius: '50%',
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

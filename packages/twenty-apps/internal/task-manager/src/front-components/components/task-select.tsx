import { useState } from 'react';
import { IconCheck, IconChevronDown } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

type TaskSelectProps = {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
  width?: number | string;
};

// Styled after twenty-ui's Select but drawn here: the twenty-ui Select opens
// through base-ui pointer handling that crashes the sandbox (the proxied event
// has no pointerType). A native <select> renders the operating system's own
// widget, which is what made the board look unlike Twenty. The list is
// positioned under the trigger, with a fixed transparent backdrop that closes
// it on an outside click.
export const TaskSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  width = 180,
}: TaskSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const selected = options.find((option) => option.value === value);

  return (
    <div style={{ position: 'relative', width }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          alignItems: 'center',
          background: TASK_TOKENS.background,
          border: `1px solid ${isOpen ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
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
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selected?.label ?? ''}
        </span>
        <IconChevronDown size={14} color={TASK_TOKENS.textTertiary} />
      </button>
      {isOpen ? (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              inset: 0,
              position: 'fixed',
              zIndex: 20,
            }}
          />
          <div
            role="listbox"
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              left: 0,
              maxHeight: 280,
              overflowY: 'auto',
              padding: 4,
              position: 'absolute',
              right: 0,
              top: 36,
              zIndex: 21,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setHoveredValue(option.value)}
                onMouseLeave={() => setHoveredValue(null)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
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
                  height: 32,
                  justifyContent: 'space-between',
                  padding: '0 8px',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {option.label}
                </span>
                {option.value === value ? (
                  <IconCheck size={14} color={TASK_TOKENS.accent} />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

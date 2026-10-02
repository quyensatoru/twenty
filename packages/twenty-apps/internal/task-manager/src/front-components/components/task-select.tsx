import { useState } from 'react';
import { IconCheck, IconChevronDown } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

type TaskSelectProps = {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
  width?: number | string;
  isDisabled?: boolean;
};

const TRIGGER_HEIGHT = 32;
const CARD_WIDTH = 220;
const OPTIONS_MAX_HEIGHT = 280;

// Styled after twenty-ui's Select but drawn here: the twenty-ui Select opens
// through base-ui pointer handling that crashes the sandbox (the proxied event
// has no pointerType), and a native <select> renders the operating system's
// own widget, which looks nothing like Twenty.
//
// Floats over the page via a host-rendered <twenty-overlay> rather than
// opening in flow. This select is only ever used inside the Custom Settings
// dialog, which is itself drawn by the host over the whole page — floating is
// not just possible there but the right call: an in-flow list pushes every
// row below it down, which inside the dialog's own fixed-height scroll area
// reads as the dialog's content jumping around on every click.
export const TaskSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  width = 180,
  isDisabled = false,
}: TaskSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const selected = options.find((option) => option.value === value);

  return (
    <div style={{ display: 'inline-flex', position: 'relative', width }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          alignItems: 'center',
          background: TASK_TOKENS.background,
          border: `1px solid ${isOpen ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: TASK_TOKENS.textPrimary,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          gap: 8,
          height: TRIGGER_HEIGHT,
          opacity: isDisabled ? 0.5 : 1,
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

      {isOpen && (
        <twenty-overlay
          offsetY={TRIGGER_HEIGHT + 4}
          onClose={() => setIsOpen(false)}
        >
          <div
            role="listbox"
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              maxHeight: OPTIONS_MAX_HEIGHT,
              overflowY: 'auto',
              padding: 4,
              width: CARD_WIDTH,
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
        </twenty-overlay>
      )}
    </div>
  );
};

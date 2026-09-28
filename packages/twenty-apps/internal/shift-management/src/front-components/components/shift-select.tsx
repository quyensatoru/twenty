import { useState } from 'react';
import { IconCheck, IconChevronDown } from 'twenty-ui/icon';

import { SHIFT_TOKENS } from './shift-tokens';

type ShiftSelectProps<TValue extends string> = {
  value: TValue;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
  ariaLabel?: string;
};

// Styled after twenty-ui's Select but drawn here: the twenty-ui Select opens
// through base-ui pointer handling that crashes the sandbox (the proxied event
// has no pointerType). The list is positioned under the trigger, with a fixed
// transparent backdrop to close it on an outside click.
export const ShiftSelect = <TValue extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: ShiftSelectProps<TValue>) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          alignItems: 'center',
          background: SHIFT_TOKENS.backgroundTransparentLighter,
          border: `1px solid ${isOpen ? SHIFT_TOKENS.accent : SHIFT_TOKENS.border}`,
          borderRadius: SHIFT_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: SHIFT_TOKENS.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: SHIFT_TOKENS.fontFamily,
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
        <IconChevronDown size={14} color={SHIFT_TOKENS.textTertiary} />
      </button>
      {isOpen ? (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ inset: 0, position: 'fixed', zIndex: 20 }}
          />
          <div
            role="listbox"
            style={{
              background: SHIFT_TOKENS.background,
              border: `1px solid ${SHIFT_TOKENS.border}`,
              borderRadius: SHIFT_TOKENS.radius,
              boxShadow: SHIFT_TOKENS.shadow,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              left: 0,
              marginTop: 4,
              maxHeight: 280,
              overflowY: 'auto',
              padding: 4,
              position: 'absolute',
              right: 0,
              top: '100%',
              zIndex: 21,
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setIsOpen(false);
                    onChange(option.value);
                  }}
                  style={{
                    alignItems: 'center',
                    background: isSelected
                      ? SHIFT_TOKENS.backgroundHover
                      : 'transparent',
                    border: 'none',
                    borderRadius: SHIFT_TOKENS.radiusSmall,
                    color: SHIFT_TOKENS.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: SHIFT_TOKENS.fontFamily,
                    fontSize: 13,
                    gap: 8,
                    height: 32,
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    textAlign: 'left',
                  }}
                >
                  <span>{option.label}</span>
                  {isSelected ? (
                    <IconCheck size={14} color={SHIFT_TOKENS.textSecondary} />
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

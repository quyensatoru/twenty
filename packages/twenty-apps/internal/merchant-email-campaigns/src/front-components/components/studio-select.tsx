import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconChevronDown } from 'twenty-ui/icon';

import { STUDIO_TOKENS } from './studio-tokens';

type StudioSelectProps<TValue extends string> = {
  value: TValue;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
  ariaLabel?: string;
};

// Styled after twenty-ui's Select but drawn here: the twenty-ui Select opens
// through base-ui pointer handling that crashes the sandbox (the proxied
// event has no pointerType). The list is positioned under the trigger, with a
// fixed transparent backdrop to close it on an outside click.
export const StudioSelect = <TValue extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: StudioSelectProps<TValue>) => {
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
          background: STUDIO_TOKENS.backgroundTransparentLighter,
          border: `1px solid ${isOpen ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border}`,
          borderRadius: STUDIO_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: STUDIO_TOKENS.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: STUDIO_TOKENS.fontFamily,
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
          {selected === undefined ? '' : t(selected.label)}
        </span>
        <IconChevronDown size={14} color={STUDIO_TOKENS.textTertiary} />
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
              background: STUDIO_TOKENS.background,
              border: `1px solid ${STUDIO_TOKENS.border}`,
              borderRadius: STUDIO_TOKENS.radius,
              boxShadow:
                'var(--t-box-shadow-strong, 0 4px 16px rgba(0,0,0,0.12))',
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
                      ? STUDIO_TOKENS.backgroundHover
                      : 'transparent',
                    border: 'none',
                    borderRadius: STUDIO_TOKENS.radiusSmall,
                    color: STUDIO_TOKENS.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: STUDIO_TOKENS.fontFamily,
                    fontSize: 13,
                    gap: 8,
                    height: 32,
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    textAlign: 'left',
                  }}
                >
                  <span>{t(option.label)}</span>
                  {isSelected ? (
                    <IconCheck size={14} color={STUDIO_TOKENS.textSecondary} />
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

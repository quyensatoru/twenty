import '../../types/front-component-host-elements';

import { type ReactNode, useState } from 'react';
import { IconCheck, IconChevronDown } from 'twenty-ui/icon';

import { BC_TOKENS, spacing, THIN_SCROLLBAR_STYLE } from './bc-theme';

export type BcSelectOption = {
  value: string;
  label: string;
  description?: string;
  startElement?: ReactNode;
};

type BcSelectProps = {
  value: string;
  options: readonly BcSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  // Filter chips read "Product: BLOY"; form fields show the value alone.
  prefix?: string;
  variant?: 'filter' | 'field';
  width?: number | string;
  menuWidth?: number;
  isDisabled?: boolean;
  isActive?: boolean;
};

const TRIGGER_HEIGHT = 32;
const FILTER_HEIGHT = 28;

// Drawn here rather than with twenty-ui's Select: that one opens through
// base-ui pointer handling the sandbox cannot proxy, and a native <select>
// shows the operating system widget. The list floats in a host overlay so
// the widget box does not clip it.
export const BcSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  prefix,
  variant = 'field',
  width,
  menuWidth = 240,
  isDisabled = false,
  isActive = false,
}: BcSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const selected = options.find((option) => option.value === value);
  const isFilter = variant === 'filter';
  const height = isFilter ? FILTER_HEIGHT : TRIGGER_HEIGHT;
  const label =
    prefix === undefined
      ? (selected?.label ?? '')
      : `${prefix}: ${selected?.label ?? ''}`;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        position: 'relative',
        width: width ?? (isFilter ? undefined : '100%'),
      }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          alignItems: 'center',
          background: isFilter
            ? isActive
              ? BC_TOKENS.backgroundSelected
              : 'transparent'
            : BC_TOKENS.background,
          border: isFilter
            ? `1px solid ${isActive ? 'transparent' : BC_TOKENS.borderLight}`
            : `1px solid ${isOpen ? BC_TOKENS.accent : BC_TOKENS.border}`,
          borderRadius: BC_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: isActive ? BC_TOKENS.accent : BC_TOKENS.textPrimary,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          fontFamily: BC_TOKENS.fontFamily,
          fontSize: BC_TOKENS.fontSizeMd,
          fontWeight: isFilter ? BC_TOKENS.fontWeightMedium : undefined,
          gap: spacing(1),
          height,
          justifyContent: 'space-between',
          opacity: isDisabled ? 0.5 : 1,
          padding: `0 ${spacing(2)}`,
          textAlign: 'left',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        <span
          style={{
            alignItems: 'center',
            display: 'inline-flex',
            gap: spacing(1.5),
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {selected?.startElement}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </span>
        </span>
        <IconChevronDown size={14} color={BC_TOKENS.textTertiary} />
      </button>

      {isOpen && (
        <twenty-overlay offsetY={height + 4} onClose={() => setIsOpen(false)}>
          <div
            role="listbox"
            aria-label={ariaLabel}
            style={{
              background: BC_TOKENS.background,
              border: `1px solid ${BC_TOKENS.border}`,
              borderRadius: BC_TOKENS.radius,
              boxShadow: BC_TOKENS.shadow,
              boxSizing: 'border-box',
              fontFamily: BC_TOKENS.fontFamily,
              maxHeight: 320,
              overflowY: 'auto',
              padding: spacing(1),
              width: menuWidth,
              ...THIN_SCROLLBAR_STYLE,
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
                        ? BC_TOKENS.backgroundHover
                        : 'transparent',
                    border: 'none',
                    borderRadius: BC_TOKENS.radiusSmall,
                    boxSizing: 'border-box',
                    color: BC_TOKENS.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: BC_TOKENS.fontFamily,
                    fontSize: BC_TOKENS.fontSizeMd,
                    gap: spacing(2),
                    minHeight: 32,
                    padding: `${spacing(1)} ${spacing(2)}`,
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {option.startElement}
                  <span style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {option.label}
                    </span>
                    {option.description !== undefined && (
                      <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
                        {option.description}
                      </span>
                    )}
                  </span>
                  {isSelected && <IconCheck size={14} color={BC_TOKENS.accent} />}
                </button>
              );
            })}
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

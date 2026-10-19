import { type CSSProperties, type ReactNode, useId, useState } from 'react';
import { IconCheck, IconChevronDown } from 'twenty-ui/icon';

import {
  PROSPECT_SCROLL_STYLE,
  PROSPECT_TOKENS as TOKENS,
} from './prospect-ui-tokens';

type ProspectButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  isDisabled?: boolean;
  label?: string;
  iconOnly?: boolean;
  size?: 'small' | 'compact' | 'medium';
};

// Base UI pointer handling is unavailable in the worker; these mirror the
// Twenty controls with host tokens, as Task Manager's adapters do.
export const ProspectButton = ({
  children,
  onClick,
  variant = 'secondary',
  isDisabled = false,
  label,
  iconOnly = false,
  size = 'medium',
}: ProspectButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const primary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={label}
      title={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: primary
          ? isHovered && !isDisabled
            ? TOKENS.accentHover
            : TOKENS.accent
          : isHovered && !isDisabled
            ? TOKENS.hover
            : variant === 'ghost'
              ? 'transparent'
              : TOKENS.background,
        border: `1px solid ${primary ? TOKENS.accent : variant === 'ghost' ? 'transparent' : TOKENS.border}`,
        borderRadius: TOKENS.radiusSmall,
        boxSizing: 'border-box',
        color: primary ? '#fff' : TOKENS.secondary,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: 500,
        gap: 4,
        height: iconOnly
          ? 24
          : size === 'small'
            ? 24
            : size === 'compact'
              ? 28
              : 32,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
        padding: iconOnly
          ? 0
          : size === 'medium'
            ? '0 12px'
            : size === 'compact'
              ? '0 10px'
              : '0 8px',
        width: iconOnly ? 24 : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};

type ProspectSelectProps = {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
  isDisabled?: boolean;
  width?: number | string;
};

export const ProspectSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  isDisabled = false,
  width = 180,
}: ProspectSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const open = () => {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };
  const choose = (index: number) => {
    if (options[index]) onChange(options[index].value);
    setIsOpen(false);
  };
  return (
    <div
      style={{
        display: 'inline-flex',
        position: 'relative',
        width,
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={isOpen ? `${listId}-${activeIndex}` : undefined}
        disabled={isDisabled}
        onClick={(event) => {
          if (!isOpen) open();
          else if (event.detail === 0) choose(activeIndex);
          else setIsOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            setIsOpen(false);
          } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) open();
            else
              setActiveIndex(
                (previous) =>
                  (previous +
                    (event.key === 'ArrowDown' ? 1 : -1) +
                    options.length) %
                  options.length,
              );
          } else if (event.key === 'Tab') setIsOpen(false);
        }}
        style={{
          alignItems: 'center',
          background: TOKENS.background,
          border: `1px solid ${isOpen ? TOKENS.accent : TOKENS.border}`,
          borderRadius: TOKENS.radiusSmall,
          color: TOKENS.text,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          fontFamily: TOKENS.fontFamily,
          fontSize: 13,
          gap: 8,
          height: 32,
          justifyContent: 'space-between',
          minWidth: 0,
          opacity: isDisabled ? 0.5 : 1,
          padding: '0 10px',
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
          {options[selectedIndex]?.label}
        </span>
        <IconChevronDown size={14} color={TOKENS.muted} />
      </button>
      {isOpen && !isDisabled && (
        <twenty-overlay offsetY={36} onClose={() => setIsOpen(false)}>
          <div
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              background: TOKENS.background,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: TOKENS.radiusSmall,
              boxShadow: TOKENS.shadow,
              boxSizing: 'border-box',
              maxHeight: 280,
              overflowY: 'auto',
              ...PROSPECT_SCROLL_STYLE,
              padding: 4,
              width: 240,
            }}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                tabIndex={-1}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
                style={{
                  alignItems: 'center',
                  background:
                    activeIndex === index ? TOKENS.hover : 'transparent',
                  border: 'none',
                  borderRadius: TOKENS.radiusExtraSmall,
                  color: TOKENS.text,
                  cursor: 'pointer',
                  display: 'flex',
                  fontFamily: TOKENS.fontFamily,
                  fontSize: 13,
                  gap: 8,
                  minHeight: 32,
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {option.label}
                {option.value === value && (
                  <IconCheck size={14} color={TOKENS.accent} />
                )}
              </button>
            ))}
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

type ProspectCheckboxProps = {
  label: string;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  isDisabled?: boolean;
};

export const ProspectCheckbox = ({
  label,
  isChecked,
  onChange,
  isDisabled = false,
}: ProspectCheckboxProps) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <label
      style={{
        alignItems: 'center',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        fontSize: 13,
        gap: 8,
        minHeight: 28,
        minWidth: 0,
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      <span
        style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          disabled={isDisabled}
          onChange={(event) => onChange(event.target.checked)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            position: 'absolute',
            inset: 0,
            margin: 0,
            opacity: 0,
            height: 16,
            width: 16,
            cursor: 'inherit',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            alignItems: 'center',
            display: 'inline-flex',
            justifyContent: 'center',
            width: 14,
            height: 14,
            border: `1px solid ${isChecked ? TOKENS.accent : TOKENS.borderStrong}`,
            borderRadius: TOKENS.radiusExtraSmall,
            background: isChecked ? TOKENS.accent : TOKENS.background,
            boxShadow: isFocused ? `0 0 0 3px ${TOKENS.accentSoft}` : 'none',
            pointerEvents: 'none',
          }}
        >
          {isChecked && <IconCheck size={12} color="#fff" />}
        </span>
      </span>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </label>
  );
};

type ProspectInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  isDisabled?: boolean;
  type?: 'text' | 'datetime-local';
  multiline?: boolean;
};

export const ProspectInput = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  isDisabled = false,
  type = 'text',
  multiline = false,
}: ProspectInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const style: CSSProperties = {
    background: TOKENS.subtle,
    border: `1px solid ${isFocused ? TOKENS.accent : TOKENS.border}`,
    borderRadius: TOKENS.radiusSmall,
    boxShadow: isFocused ? `0 0 0 3px ${TOKENS.accentSoft}` : 'none',
    boxSizing: 'border-box',
    color: TOKENS.text,
    colorScheme: 'inherit',
    fontFamily: TOKENS.fontFamily,
    fontSize: 13,
    height: multiline ? 224 : 32,
    lineHeight: multiline ? 1.8 : undefined,
    minWidth: 0,
    opacity: isDisabled ? 0.5 : 1,
    outline: 'none',
    padding: multiline ? 16 : '0 10px',
    resize: multiline ? 'vertical' : undefined,
    width: '100%',
    ...PROSPECT_SCROLL_STYLE,
  };
  const props = {
    'aria-label': ariaLabel,
    value,
    placeholder,
    disabled: isDisabled,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    style,
  };
  return multiline ? (
    <textarea
      {...props}
      wrap="off"
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
    />
  ) : (
    <input
      {...props}
      type={type}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};

type ProspectOverlayProps = {
  offsetY?: number;
  onClose?: () => void;
  children?: ReactNode;
};
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'twenty-overlay': ProspectOverlayProps;
    }
  }
}

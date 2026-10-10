import { type ReactNode, useState } from 'react';
import { IconChevronDown, IconChevronRight } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

type DevelopmentSectionProps = {
  title: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
  initiallyOpen?: boolean;
  summary?: string;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

export const DevelopmentSection = ({
  title,
  icon,
  count,
  children,
  initiallyOpen = false,
  summary,
  isOpen: controlledIsOpen,
  onOpenChange,
}: DevelopmentSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(initiallyOpen);
  const isOpen = controlledIsOpen ?? isExpanded;
  const [isHovered, setIsHovered] = useState(false);
  const Chevron = isOpen ? IconChevronDown : IconChevronRight;

  return (
    <section aria-label={title} style={{ minWidth: 0 }}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => {
          setIsExpanded(!isOpen);
          onOpenChange?.(!isOpen);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          alignItems: 'center',
          background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
          border: 0,
          borderRadius: TASK_TOKENS.radiusExtraSmall,
          color: TASK_TOKENS.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 8,
          minHeight: 38,
          padding: '6px 8px',
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
        <span
          style={{
            background: TASK_TOKENS.backgroundTertiary,
            borderRadius: TASK_TOKENS.radiusExtraSmall,
            color: TASK_TOKENS.textSecondary,
            fontSize: 11,
            minWidth: 18,
            padding: '2px 4px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          {count}
        </span>
        <span
          title={summary}
          style={{
            color: TASK_TOKENS.textTertiary,
            flex: 1,
            fontSize: 11,
            minWidth: 0,
            overflow: 'hidden',
            textAlign: 'right',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isOpen ? null : summary}
        </span>
        <Chevron size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
      </button>
      {isOpen && (
        <div style={{ padding: '0 8px 8px', minWidth: 0 }}>{children}</div>
      )}
    </section>
  );
};

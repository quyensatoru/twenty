import { type ReactNode, useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskTabsProps<TTab extends string> = {
  value: TTab;
  tabs: readonly {
    value: TTab;
    label: string;
    count?: number;
    icon?: ReactNode;
  }[];
  onChange: (value: TTab) => void;
  // `underline` sits on a rule across the full width, for a section's tabs;
  // `segmented` is the compact pill strip for a dialog's.
  variant?: 'segmented' | 'underline';
  // Drawn at the far end of an underline strip: a sort toggle, a filter.
  trailing?: ReactNode;
  // An underline strip inside a narrow panel: tighter spacing.
  isCompact?: boolean;
};

// A Linear-style segmented control: the strip itself is inset, the active tab
// is a raised card on it and the rest are plain text. No underline to reserve,
// so switching tabs never moves anything by a pixel.
export const TaskTabs = <TTab extends string>({
  value,
  tabs,
  onChange,
  variant = 'segmented',
  trailing,
  isCompact = false,
}: TaskTabsProps<TTab>) => {
  const [hoveredTab, setHoveredTab] = useState<TTab | null>(null);

  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          display: 'flex',
          flexShrink: 0,
          gap: isCompact ? 14 : 16,
          maxWidth: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.value === value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onMouseEnter={() => setHoveredTab(tab.value)}
              onMouseLeave={() => setHoveredTab(null)}
              onClick={() => onChange(tab.value)}
              style={{
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? TASK_TOKENS.textPrimary : 'transparent'}`,
                color:
                  isActive || hoveredTab === tab.value
                    ? TASK_TOKENS.textPrimary
                    : TASK_TOKENS.textTertiary,
                cursor: 'pointer',
                display: 'inline-flex',
                flexShrink: 0,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 13,
                fontWeight: 500,
                gap: isCompact ? 5 : 6,
                height: isCompact ? 32 : 34,
                padding: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    fontSize: 11.5,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
        {trailing !== undefined && (
          <>
            <span style={{ flex: 1 }} />
            {trailing}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      style={{
        alignSelf: 'flex-start',
        background: TASK_TOKENS.backgroundTertiary,
        borderRadius: TASK_TOKENS.radius,
        display: 'inline-flex',
        gap: 2,
        maxWidth: '100%',
        padding: 4,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onMouseEnter={() => setHoveredTab(tab.value)}
            onMouseLeave={() => setHoveredTab(null)}
            onClick={() => onChange(tab.value)}
            style={{
              alignItems: 'center',
              background: isActive ? TASK_TOKENS.background : 'transparent',
              border: 'none',
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: isActive ? TASK_TOKENS.shadowLight : 'none',
              color: isActive
                ? TASK_TOKENS.textPrimary
                : hoveredTab === tab.value
                  ? TASK_TOKENS.textPrimary
                  : TASK_TOKENS.textTertiary,
              cursor: 'pointer',
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              gap: 6,
              height: 28,
              padding: '0 12px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.count === undefined ? null : (
              <span
                style={{
                  background: isActive
                    ? TASK_TOKENS.backgroundTertiary
                    : 'transparent',
                  borderRadius: TASK_TOKENS.radiusSmall,
                  color:
                    isActive || hoveredTab === tab.value
                      ? TASK_TOKENS.textSecondary
                      : TASK_TOKENS.textTertiary,
                  fontSize: 11,
                  lineHeight: '16px',
                  // Held open for two digits: a counter growing from 9 to 10
                  // would otherwise widen its tab and push the next one along
                  // every time somebody comments.
                  minWidth: 16,
                  padding: '0 4px',
                  textAlign: 'center',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

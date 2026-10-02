import { useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskTabsProps<TTab extends string> = {
  value: TTab;
  tabs: readonly { value: TTab; label: string; count?: number }[];
  onChange: (value: TTab) => void;
};

// The active tab is the accent colour and carries a 2px underline of its own
// over the strip's divider; the rest are tertiary text. Inactive tabs reserve
// the same 2px so switching tabs never moves the strip by a pixel.
export const TaskTabs = <TTab extends string>({
  value,
  tabs,
  onChange,
}: TaskTabsProps<TTab>) => {
  const [hoveredTab, setHoveredTab] = useState<TTab | null>(null);

  return (
    <div
      role="tablist"
      style={{
        borderBottom: `1px solid ${TASK_TOKENS.border}`,
        display: 'flex',
        gap: 4,
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
              borderBottom: `2px solid ${isActive ? TASK_TOKENS.accent : 'transparent'}`,
              color: isActive
                ? TASK_TOKENS.accent
                : hoveredTab === tab.value
                  ? TASK_TOKENS.textPrimary
                  : TASK_TOKENS.textTertiary,
              cursor: 'pointer',
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              gap: 6,
              height: 34,
              marginBottom: -1,
              padding: '0 8px',
            }}
          >
            {tab.label}
            {tab.count === undefined ? null : (
              <span
                style={{
                  background: TASK_TOKENS.backgroundTertiary,
                  borderRadius: TASK_TOKENS.radiusSmall,
                  color: TASK_TOKENS.textTertiary,
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

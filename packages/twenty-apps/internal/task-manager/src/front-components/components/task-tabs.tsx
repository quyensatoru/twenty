import { useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskTabsProps<TTab extends string> = {
  value: TTab;
  tabs: readonly { value: TTab; label: string; count?: number }[];
  onChange: (value: TTab) => void;
};

// A Linear-style segmented control: the strip itself is inset, the active tab
// is a raised card on it and the rest are plain text. No underline to reserve,
// so switching tabs never moves anything by a pixel.
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

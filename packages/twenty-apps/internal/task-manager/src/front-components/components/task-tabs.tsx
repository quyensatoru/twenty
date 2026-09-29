import { useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskTabsProps<TTab extends string> = {
  value: TTab;
  tabs: readonly { value: TTab; label: string; count?: number }[];
  onChange: (value: TTab) => void;
};

// Styled after twenty-ui's TabButton: the active tab is marked by a 1px
// underline in the accent colour, the rest are tertiary text.
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
              borderBottom: `1px solid ${isActive ? TASK_TOKENS.accent : 'transparent'}`,
              color:
                isActive || hoveredTab === tab.value
                  ? TASK_TOKENS.textPrimary
                  : TASK_TOKENS.textTertiary,
              cursor: 'pointer',
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              fontWeight: 500,
              gap: 6,
              height: 32,
              marginBottom: -1,
              padding: '0 8px',
            }}
          >
            {tab.label}
            {tab.count === undefined ? null : (
              <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconUser } from 'twenty-ui/icon';

import { TaskAvatar } from './task-avatar';
import { TASK_CIRCLE_STYLE, TASK_TOKENS } from './task-tokens';

export const UNASSIGNED_ASSIGNEE_VALUE = 'UNASSIGNED';

export type TaskBoardAssigneeOption = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type TaskBoardAssigneeFilterProps = {
  options: readonly TaskBoardAssigneeOption[];
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
};

const AVATAR_SIZE = 28;
const MAX_VISIBLE = 6;

// Jira's quick filter: the people on the board as a row of faces, each a
// toggle, so "what is Anna working on" is one click instead of a dropdown.
// Picks combine as OR. Faces past MAX_VISIBLE fold into a "+N" menu.
export const TaskBoardAssigneeFilter = ({
  options,
  selectedIds,
  onToggle,
}: TaskBoardAssigneeFilterProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  if (options.length === 0) {
    return null;
  }

  const visibleOptions = options.slice(0, MAX_VISIBLE);
  const overflowOptions = options.slice(MAX_VISIBLE);
  const selectedOverflowCount = overflowOptions.filter((option) =>
    selectedIds.includes(option.id),
  ).length;

  return (
    <div
      role="group"
      aria-label={t('Filter by assignee')}
      style={{ alignItems: 'center', display: 'inline-flex', paddingLeft: 4 }}
    >
      {visibleOptions.map((option, index) => {
        const isSelected = selectedIds.includes(option.id);
        const isHovered = hoveredId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={option.name}
            title={option.name}
            onClick={() => onToggle(option.id)}
            onMouseEnter={() => setHoveredId(option.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              background: TASK_TOKENS.background,
              border: 'none',
              ...TASK_CIRCLE_STYLE,
              boxShadow: `0 0 0 2px ${isSelected ? TASK_TOKENS.accent : TASK_TOKENS.background}`,
              cursor: 'pointer',
              display: 'inline-flex',
              marginLeft: index === 0 ? 0 : -4,
              padding: 0,
              position: 'relative',
              transform: isHovered ? 'translateY(-2px)' : 'none',
              transition: 'transform 120ms ease',
              zIndex: isHovered || isSelected ? 2 : 1,
            }}
          >
            {option.id === UNASSIGNED_ASSIGNEE_VALUE ? (
              <UnassignedFace size={AVATAR_SIZE} />
            ) : (
              <TaskAvatar
                name={option.name}
                avatarUrl={option.avatarUrl}
                size={AVATAR_SIZE}
              />
            )}
          </button>
        );
      })}
      {overflowOptions.length > 0 && (
        <span style={{ display: 'inline-flex', marginLeft: -4, position: 'relative' }}>
          <button
            type="button"
            aria-label={t('More assignees')}
            aria-expanded={isOverflowOpen}
            onClick={() => setIsOverflowOpen(!isOverflowOpen)}
            style={{
              alignItems: 'center',
              background: TASK_TOKENS.backgroundTertiary,
              border: 'none',
              ...TASK_CIRCLE_STYLE,
              boxShadow: `0 0 0 2px ${selectedOverflowCount > 0 ? TASK_TOKENS.accent : TASK_TOKENS.background}`,
              color: TASK_TOKENS.textSecondary,
              cursor: 'pointer',
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 11,
              fontWeight: 600,
              height: AVATAR_SIZE,
              justifyContent: 'center',
              padding: 0,
              width: AVATAR_SIZE,
            }}
          >
            +{overflowOptions.length}
          </button>
          {isOverflowOpen && (
            <twenty-overlay
              offsetX={0}
              offsetY={AVATAR_SIZE + 6}
              onClose={() => setIsOverflowOpen(false)}
            >
              <div
                role="menu"
                style={{
                  background: TASK_TOKENS.background,
                  border: `1px solid ${TASK_TOKENS.border}`,
                  borderRadius: TASK_TOKENS.radiusSmall,
                  boxShadow: TASK_TOKENS.shadowStrong,
                  boxSizing: 'border-box',
                  maxHeight: 280,
                  overflowY: 'auto',
                  padding: 4,
                  width: 220,
                }}
              >
                {overflowOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={selectedIds.includes(option.id)}
                    onClick={() => onToggle(option.id)}
                    onMouseEnter={() => setHoveredId(option.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      alignItems: 'center',
                      background:
                        hoveredId === option.id
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
                      minHeight: 32,
                      padding: '0 8px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    {option.id === UNASSIGNED_ASSIGNEE_VALUE ? (
                      <UnassignedFace size={20} />
                    ) : (
                      <TaskAvatar name={option.name} avatarUrl={option.avatarUrl} size={20} />
                    )}
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.name}
                    </span>
                    {selectedIds.includes(option.id) && (
                      <IconCheck size={14} color={TASK_TOKENS.accent} />
                    )}
                  </button>
                ))}
              </div>
            </twenty-overlay>
          )}
        </span>
      )}
    </div>
  );
};

const UnassignedFace = ({ size }: { size: number }) => (
  <span
    style={{
      alignItems: 'center',
      background: TASK_TOKENS.backgroundTertiary,
      ...TASK_CIRCLE_STYLE,
      display: 'inline-flex',
      flexShrink: 0,
      height: size,
      justifyContent: 'center',
      width: size,
    }}
  >
    <IconUser size={Math.round(size * 0.6)} color={TASK_TOKENS.textTertiary} />
  </span>
);

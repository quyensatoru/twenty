import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconTrash, IconX } from 'twenty-ui/icon';

import {
  TaskPropertyMenu,
  type TaskPropertyMenuOption,
} from './task-property-menu';
import { TASK_TOKENS } from './task-tokens';

type TaskBacklogBulkBarProps = {
  selectedCount: number;
  sprintOptions: readonly TaskPropertyMenuOption[];
  statusOptions: readonly TaskPropertyMenuOption[];
  priorityOptions: readonly TaskPropertyMenuOption[];
  assigneeOptions: readonly TaskPropertyMenuOption[];
  onMoveToSection: (sectionKey: string) => void;
  onChangeStatus: (statusId: string) => void;
  onChangePriority: (priority: string) => void;
  onChangeAssignee: (assigneeId: string) => void;
  // Absent for a member who cannot delete: the trash button is not drawn.
  onDelete: (() => void) | null;
  onClear: () => void;
};

const BAR_CONTROL_HEIGHT = 28;
// Inverted bar: its controls take the page background as their text colour.
const BAR_TEXT_COLOR = TASK_TOKENS.background;
const BAR_DIVIDER_COLOR = 'rgba(127,127,127,0.4)';

// Floats over the bottom of the backlog while rows are checked: what the
// selection is, and what can be done to every row of it at once.
export const TaskBacklogBulkBar = ({
  selectedCount,
  sprintOptions,
  statusOptions,
  priorityOptions,
  assigneeOptions,
  onMoveToSection,
  onChangeStatus,
  onChangePriority,
  onChangeAssignee,
  onDelete,
  onClear,
}: TaskBacklogBulkBarProps) => {
  // Delete asks twice, like the "..." menus: the first click turns the button
  // into the confirmation, the second deletes.
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const renderMenu = (
    label: string,
    options: readonly TaskPropertyMenuOption[],
    onSelect: (value: string) => void,
  ) => (
    <TaskPropertyMenu
      label={label}
      triggerSize={BAR_CONTROL_HEIGHT}
      trigger={<BarLabel>{label}</BarLabel>}
      options={options}
      selectedValue={null}
      onSelect={onSelect}
    />
  );

  return (
    <div
      role="toolbar"
      aria-label={t('Bulk actions')}
      style={{
        alignItems: 'center',
        background: TASK_TOKENS.textPrimary,
        borderRadius: TASK_TOKENS.radius,
        bottom: 18,
        boxShadow: TASK_TOKENS.shadowStrong,
        boxSizing: 'border-box',
        color: BAR_TEXT_COLOR,
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: 500,
        gap: 4,
        left: '50%',
        maxWidth: 'calc(100% - 32px)',
        padding: '4px 4px 4px 12px',
        position: 'absolute',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        zIndex: 2,
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums', paddingRight: 4 }}>
        {t('{count} selected', { count: selectedCount })}
      </span>
      <BarDivider />
      {renderMenu(t('Move to sprint'), sprintOptions, onMoveToSection)}
      {renderMenu(t('Status'), statusOptions, onChangeStatus)}
      {renderMenu(t('Assignee'), assigneeOptions, onChangeAssignee)}
      {renderMenu(t('Priority'), priorityOptions, onChangePriority)}
      <BarDivider />
      {onDelete !== null && (
        <button
          type="button"
          aria-label={t('Delete selected issues')}
          title={t('Delete selected issues')}
          onClick={() => {
            if (!isConfirmingDelete) {
              setIsConfirmingDelete(true);

              return;
            }

            setIsConfirmingDelete(false);
            onDelete();
          }}
          onMouseLeave={() => setIsConfirmingDelete(false)}
          style={{
            alignItems: 'center',
            background: isConfirmingDelete ? TASK_TOKENS.red : 'transparent',
            border: 'none',
            borderRadius: TASK_TOKENS.radiusSmall,
            color: isConfirmingDelete ? '#ffffff' : BAR_TEXT_COLOR,
            cursor: 'pointer',
            display: 'inline-flex',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 600,
            gap: 6,
            height: BAR_CONTROL_HEIGHT,
            justifyContent: 'center',
            minWidth: BAR_CONTROL_HEIGHT,
            padding: isConfirmingDelete ? '0 10px' : 0,
          }}
        >
          <IconTrash size={14} />
          {isConfirmingDelete &&
            (selectedCount === 1
              ? t('Delete 1 issue?')
              : t('Delete {count} issues?', { count: selectedCount }))}
        </button>
      )}
      <button
        type="button"
        aria-label={t('Clear selection')}
        title={t('Clear selection')}
        onClick={onClear}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radiusSmall,
          color: BAR_TEXT_COLOR,
          cursor: 'pointer',
          display: 'inline-flex',
          height: BAR_CONTROL_HEIGHT,
          justifyContent: 'center',
          padding: 0,
          width: BAR_CONTROL_HEIGHT,
        }}
      >
        <IconX size={14} />
      </button>
    </div>
  );
};

const BarLabel = ({ children }: { children: string }) => (
  <span
    style={{
      color: BAR_TEXT_COLOR,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      fontWeight: 500,
      opacity: 0.86,
      padding: '0 8px',
    }}
  >
    {children}
  </span>
);

const BarDivider = () => (
  <span
    aria-hidden
    style={{
      background: BAR_DIVIDER_COLOR,
      flexShrink: 0,
      height: 16,
      margin: '0 4px',
      width: 1,
    }}
  />
);

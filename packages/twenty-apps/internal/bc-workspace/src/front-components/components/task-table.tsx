import { type ReactNode, useRef } from 'react';
import { t, useLocale } from 'twenty-sdk/front-component';
import { IconArrowUpRight, IconBolt, IconPencil } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';

import { type TaskStatus } from '../../types/bc-records';
import { type TaskListRow } from '../../types/tasks';
import { type SortState } from '../../utils/sort-records.util';
import { formatTaskDate } from '../utils/task-date-format.util';
import { OPTION_SETS, toSelectOptions } from '../utils/option-labels.util';
import { BcSelect } from './bc-select';
import {
  CELL_STYLE,
  HoverRow,
  SortableHeaderCell,
  TABLE_STYLE,
} from './bc-table';
import { OptionTag, PriorityTag, TaskStatusTag } from './bc-tags';
import { BC_TOKENS, spacing } from './bc-theme';
import { displayGeneratedText } from '../utils/display-text.util';

type TaskTableProps = {
  rows: TaskListRow[];
  sort: SortState;
  selectedId: string | null;
  savingId: string | null;
  isMobile: boolean;
  timeZone: string;
  onSortChange: (sort: SortState) => void;
  onSelect: (taskId: string) => void;
  onStatusChange: (row: TaskListRow, status: TaskStatus) => void;
};

// A click on the inline status control must not also open the row. The flag
// is cleared on the next tick because the sandbox does not reliably stop the
// event from reaching the row.
const useControlClickGuard = () => {
  const isControlClick = useRef(false);

  return {
    markControl: () => {
      isControlClick.current = true;
      setTimeout(() => {
        isControlClick.current = false;
      }, 0);
    },
    consumeControlClick: () => {
      const wasControl = isControlClick.current;

      isControlClick.current = false;

      return wasControl;
    },
  };
};

const SubText = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      color: BC_TOKENS.textTertiary,
      display: 'block',
      fontSize: BC_TOKENS.fontSizeSm,
      maxWidth: 320,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {children}
  </span>
);

export const TaskCategoryTag = ({
  category,
  customCategory,
}: Pick<TaskListRow, 'category' | 'customCategory'>) =>
  category === 'OTHER' && customCategory !== null && customCategory.length > 0 ? (
    <Tag color="gray">{customCategory}</Tag>
  ) : (
    <OptionTag options={OPTION_SETS.taskCategory} value={category} />
  );

export const TaskSourceLabel = ({ source }: Pick<TaskListRow, 'source'>) => (
  <span
    style={{
      alignItems: 'center',
      color: BC_TOKENS.textTertiary,
      display: 'inline-flex',
      fontSize: BC_TOKENS.fontSizeSm,
      gap: spacing(1),
    }}
  >
    {source === 'AUTO' ? <IconBolt size={12} /> : <IconPencil size={12} />}
    {source === 'AUTO' ? t('Automatic') : t('Manual')}
  </span>
);

const StatusControl = ({
  row,
  isSaving,
  onStatusChange,
  onControlClick,
}: {
  row: TaskListRow;
  isSaving: boolean;
  onStatusChange: TaskTableProps['onStatusChange'];
  onControlClick: () => void;
}) =>
  row.canEdit ? (
    <span onClick={onControlClick} style={{ display: 'inline-flex' }}>
      <BcSelect
        value={row.status}
        width={140}
        menuWidth={180}
        isDisabled={isSaving}
        ariaLabel={t('Status of {task}', { task: row.title })}
        options={toSelectOptions(OPTION_SETS.taskStatus)}
        onChange={(status) => {
          if (status !== row.status) {
            onStatusChange(row, status as TaskStatus);
          }
        }}
      />
    </span>
  ) : (
    <TaskStatusTag value={row.status} />
  );

const ClientCell = ({ row }: { row: TaskListRow }) =>
  row.vipClient === null ? (
    <span style={{ color: BC_TOKENS.textTertiary }}>{t('Personal task')}</span>
  ) : (
    <span style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>
        {row.vipClient.name ?? row.vipClient.shopDomain ?? ''}
      </span>
      {row.vipClient.shopDomain !== null && <SubText>{row.vipClient.shopDomain}</SubText>}
    </span>
  );

export const TaskTable = ({
  rows,
  sort,
  selectedId,
  savingId,
  isMobile,
  timeZone,
  onSortChange,
  onSelect,
  onStatusChange,
}: TaskTableProps) => {
  const locale = useLocale();
  const { markControl, consumeControlClick } = useControlClickGuard();
  const openRow = (taskId: string) => {
    if (!consumeControlClick()) {
      onSelect(taskId);
    }
  };

  if (isMobile) {
    return (
      <div>
        {rows.map((row) => (
          <div
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => openRow(row.id)}
            style={{
              background:
                row.id === selectedId ? BC_TOKENS.backgroundSelected : 'transparent',
              borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(1.5),
              padding: `${spacing(3)} ${spacing(3)}`,
            }}
          >
            <span style={{ alignItems: 'center', display: 'flex', gap: spacing(2), justifyContent: 'space-between' }}>
              <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>{displayGeneratedText(row.title)}</span>
              <PriorityTag value={row.priority} />
            </span>
            <ClientCell row={row} />
            <span style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(2) }}>
              <TaskCategoryTag category={row.category} customCategory={row.customCategory} />
              <TaskSourceLabel source={row.source} />
              <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
                {formatTaskDate(row.createdAt, locale, timeZone)}
              </span>
            </span>
            <StatusControl
              row={row}
              isSaving={savingId === row.id}
              onStatusChange={onStatusChange}
              onControlClick={markControl}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <table style={{ ...TABLE_STYLE, minWidth: 1180 }}>
      <thead>
        <tr>
          <SortableHeaderCell label={t('Task')} sortKey="title" sort={sort} onSortChange={onSortChange} />
          <SortableHeaderCell label={t('Client')} sortKey="client" sort={sort} onSortChange={onSortChange} />
          <SortableHeaderCell label={t('Category')} sortKey="category" sort={sort} onSortChange={onSortChange} />
          <SortableHeaderCell label={t('Source')} sortKey="source" sort={sort} onSortChange={onSortChange} />
          <SortableHeaderCell label={t('Assigned PIC')} sortKey="owner" sort={sort} onSortChange={onSortChange} />
          <SortableHeaderCell label={t('Priority')} sortKey="priority" sort={sort} onSortChange={onSortChange} />
          <SortableHeaderCell label={t('Status')} sortKey="status" sort={sort} onSortChange={onSortChange} />
          <SortableHeaderCell
            label={t('Created date')}
            sortKey="createdAt"
            defaultSort={{ key: 'createdAt', direction: 'DESC' }}
            sort={sort}
            onSortChange={onSortChange}
          />
          <SortableHeaderCell
            label={t('Actions')}
            sort={sort}
            onSortChange={onSortChange}
            style={{ borderRight: 'none', width: 1 }}
          />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <HoverRow key={row.id} isSelected={row.id === selectedId} onClick={() => openRow(row.id)}>
            <td style={{ ...CELL_STYLE, maxWidth: 360, whiteSpace: 'normal' }}>
              <span style={{ display: 'block', fontWeight: BC_TOKENS.fontWeightMedium }}>
                {displayGeneratedText(row.title)}
              </span>
              {row.notesExcerpt !== null && <SubText>{row.notesExcerpt}</SubText>}
            </td>
            <td style={CELL_STYLE}>
              <ClientCell row={row} />
            </td>
            <td style={CELL_STYLE}>
              <TaskCategoryTag category={row.category} customCategory={row.customCategory} />
            </td>
            <td style={CELL_STYLE}>
              <TaskSourceLabel source={row.source} />
            </td>
            <td style={{ ...CELL_STYLE, color: BC_TOKENS.textSecondary }}>
              {row.ownerName ?? t('Unassigned')}
            </td>
            <td style={CELL_STYLE}>
              <PriorityTag value={row.priority} />
            </td>
            <td style={CELL_STYLE}>
              <StatusControl
                row={row}
                isSaving={savingId === row.id}
                onStatusChange={onStatusChange}
                onControlClick={markControl}
              />
            </td>
            <td style={{ ...CELL_STYLE, color: BC_TOKENS.textSecondary }}>
              {formatTaskDate(row.createdAt, locale, timeZone)}
            </td>
            <td style={{ ...CELL_STYLE, borderRight: 'none' }}>
              <button
                type="button"
                aria-label={t('Open details of {task}', { task: displayGeneratedText(row.title) })}
                onClick={() => {
                  markControl();
                  onSelect(row.id);
                }}
                style={{
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: BC_TOKENS.accent,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  fontFamily: BC_TOKENS.fontFamily,
                  fontSize: BC_TOKENS.fontSizeMd,
                  gap: 2,
                  padding: 0,
                }}
              >
                {t('Details')}
                <IconArrowUpRight size={12} />
              </button>
            </td>
          </HoverRow>
        ))}
      </tbody>
    </table>
  );
};

import {
  type TaskCategory,
  type TaskPriority,
  type TaskSource,
  type TaskStatus,
} from '../../types/bc-records';
import {
  type TaskClientSummary,
  type TaskKpiFilter,
  type TaskListRequest,
} from '../../types/tasks';
import { type SortState } from '../../utils/sort-records.util';
import { readZonedDate, shiftDate } from '../../utils/task-date-range.util';

export type CreatedPreset = 'ALL' | '7' | '30' | '90' | 'CUSTOM';

export type TaskFilterState = {
  kpi: TaskKpiFilter | null;
  vipClient: TaskClientSummary | null;
  status: TaskStatus | null;
  category: TaskCategory | null;
  source: TaskSource | null;
  priority: TaskPriority | null;
  ownerId: string | null;
  createdPreset: CreatedPreset;
  customFrom: string;
  customTo: string;
  search: string;
};

export const DEFAULT_TASK_FILTERS: TaskFilterState = {
  kpi: null,
  vipClient: null,
  status: null,
  category: null,
  source: null,
  priority: null,
  ownerId: null,
  createdPreset: 'ALL',
  customFrom: '',
  customTo: '',
  search: '',
};

export const TASK_PAGE_SIZE = 50;

// "Last 7 days" includes today, counted in the reporting timezone.
export const readCreatedBounds = (
  filters: TaskFilterState,
  timeZone: string,
  nowMs: number,
): { createdFrom: string | null; createdTo: string | null } => {
  if (filters.createdPreset === 'ALL') {
    return { createdFrom: null, createdTo: null };
  }

  if (filters.createdPreset === 'CUSTOM') {
    return {
      createdFrom: filters.customFrom.length > 0 ? filters.customFrom : null,
      createdTo: filters.customTo.length > 0 ? filters.customTo : null,
    };
  }

  const today = readZonedDate(nowMs, timeZone);

  return {
    createdFrom: shiftDate(today, 1 - Number(filters.createdPreset)),
    createdTo: today,
  };
};

export const buildTaskListRequest = ({
  filters,
  sort,
  page,
  timeZone,
  nowMs,
}: {
  filters: TaskFilterState;
  sort: SortState;
  page: number;
  timeZone: string;
  nowMs: number;
}): TaskListRequest => ({
  kpi: filters.kpi,
  status: filters.status,
  category: filters.category,
  source: filters.source,
  priority: filters.priority,
  ownerId: filters.ownerId,
  vipClientId: filters.vipClient?.id ?? null,
  ...readCreatedBounds(filters, timeZone, nowMs),
  search: filters.search.trim(),
  sort,
  page,
  pageSize: TASK_PAGE_SIZE,
});

export const countActiveFilters = (filters: TaskFilterState): number =>
  [
    filters.kpi,
    filters.vipClient,
    filters.status,
    filters.category,
    filters.source,
    filters.priority,
    filters.ownerId,
    filters.createdPreset === 'ALL' ? null : filters.createdPreset,
  ].filter((value) => value !== null).length;

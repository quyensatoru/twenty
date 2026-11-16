import {
  type HistoryEntry,
  type IssueStatus,
  type OpportunityStatus,
  type TaskCategory,
  type TaskOutcomeStatus,
  type TaskPriority,
  type TaskSource,
  type TaskStatus,
  type TaskTriggerType,
} from './bc-records';
import { type SortState } from '../utils/sort-records.util';

export type TaskClientSummary = {
  id: string;
  name: string | null;
  shopDomain: string | null;
};

// KPI cards filter the table: Open = To Do + In Progress, High = open High.
export type TaskKpiFilter = 'OPEN' | 'AUTOMATIC' | 'COMPLETED' | 'HIGH_OPEN';

export type TaskListRequest = {
  kpi: TaskKpiFilter | null;
  status: TaskStatus | null;
  category: TaskCategory | null;
  source: TaskSource | null;
  priority: TaskPriority | null;
  ownerId: string | null;
  vipClientId: string | null;
  createdFrom: string | null;
  createdTo: string | null;
  search: string;
  sort: SortState;
  page: number;
  pageSize: number;
};

export type TaskListRow = {
  id: string;
  title: string;
  notesExcerpt: string | null;
  vipClient: TaskClientSummary | null;
  category: TaskCategory;
  customCategory: string | null;
  source: TaskSource;
  triggerType: TaskTriggerType | null;
  ownerId: string | null;
  ownerName: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  outcomeStatus: TaskOutcomeStatus | null;
  createdAt: string;
  completedAt: string | null;
  appName: string | null;
  canEdit: boolean;
};

export type TaskListKpis = {
  open: number;
  automatic: number;
  completed: number;
  highPriorityOpen: number;
};

export type TaskListResult = {
  rows: TaskListRow[];
  kpis: TaskListKpis;
  page: number;
  pageCount: number;
  total: number;
  scopeTotal: number;
};

export type TaskSaveRequest = {
  taskId: string | null;
  title: string;
  notes: string;
  vipClientId: string | null;
  category: TaskCategory;
  customCategory: string;
  priority: TaskPriority;
  status: TaskStatus;
  outcome: string;
  outcomeStatus: TaskOutcomeStatus | null;
  appName: string | null;
};

export type TaskHistoryItem = HistoryEntry & { actorName: string | null };

export type TaskDetail = {
  id: string;
  title: string;
  notes: string | null;
  category: TaskCategory;
  customCategory: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  triggerType: TaskTriggerType | null;
  outcome: string | null;
  outcomeStatus: TaskOutcomeStatus | null;
  createdAt: string;
  completedAt: string | null;
  appName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  vipClient: TaskClientSummary | null;
  issue: { id: string; title: string | null; status: IssueStatus } | null;
  opportunity: {
    id: string;
    appName: string | null;
    plan: string | null;
    billingCycle: string | null;
    usagePercent: number | null;
    status: OpportunityStatus;
  } | null;
  developerTasks: TaskDeveloperTaskLink[];
  history: TaskHistoryItem[];
  canEdit: boolean;
};

export type TaskDeveloperTaskLink = {
  activityId: string;
  developerIssueId: string;
  title: string;
  appName: string | null;
  createdAt: string;
};

export type TaskDetailResult = { task: TaskDetail };

export type ClientSearchItem = {
  id: string;
  name: string | null;
  shopDomain: string | null;
  picName: string | null;
};

export type ClientSearchResult = { clients: ClientSearchItem[]; hasMore: boolean };

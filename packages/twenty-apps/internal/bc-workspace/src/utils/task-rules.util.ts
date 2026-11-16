import {
  type HistoryEntry,
  type TaskCategory,
  type TaskOutcomeStatus,
  type TaskPriority,
  type TaskStatus,
} from '../types/bc-records';
import { appendHistory } from './history.util';

export const CUSTOM_CATEGORY_MAX_LENGTH = 80;
export const TASK_TITLE_MAX_LENGTH = 250;

export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

export const OPEN_TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS'];

export const isOpenTaskStatus = (status: TaskStatus): boolean =>
  OPEN_TASK_STATUSES.includes(status);

// The completion column of every task drilldown: Cancelled and In Progress
// are both "Not completed", the status itself shows next to it.
export const readCompletionLabel = (status: TaskStatus): 'COMPLETED' | 'NOT_COMPLETED' =>
  status === 'COMPLETED' ? 'COMPLETED' : 'NOT_COMPLETED';

export type TaskDraftInput = {
  title: string;
  notes: string;
  category: TaskCategory;
  customCategory: string;
  priority: TaskPriority;
  status: TaskStatus;
  outcome: string;
  outcomeStatus: TaskOutcomeStatus | null;
};

export type TaskDraftErrors = Partial<Record<'title' | 'customCategory', string>>;

// English source messages; the page translates them with t().
export const validateTaskDraft = (draft: TaskDraftInput): TaskDraftErrors => {
  const errors: TaskDraftErrors = {};

  if (draft.title.trim().length === 0) {
    errors.title = 'Enter a task title.';
  } else if (draft.title.trim().length > TASK_TITLE_MAX_LENGTH) {
    errors.title = 'Keep the title under 250 characters.';
  }

  if (draft.category === 'OTHER') {
    const customCategory = draft.customCategory.trim();

    if (customCategory.length === 0) {
      errors.customCategory = 'Name the custom category.';
    } else if (customCategory.length > CUSTOM_CATEGORY_MAX_LENGTH) {
      errors.customCategory = 'Keep the category name under 80 characters.';
    }
  }

  return errors;
};

// What is stored: the custom label only for Other, the upsell outcome only
// for Upsell.
export const normalizeTaskDraft = (draft: TaskDraftInput) => ({
  title: draft.title.trim(),
  notes: draft.notes.trim().length === 0 ? null : draft.notes.trim(),
  category: draft.category,
  customCategory:
    draft.category === 'OTHER' ? draft.customCategory.trim() : null,
  priority: draft.priority,
  status: draft.status,
  outcome: draft.outcome.trim().length === 0 ? null : draft.outcome.trim(),
  outcomeStatus:
    draft.category === 'UPSELL' ? (draft.outcomeStatus ?? 'PENDING') : null,
});

// Every status change, from the panel or the table's inline select, adds a
// STATUS_CHANGED entry with from/to/at. Analytics counts Tasks Completed from
// those entries, so leaving Completed clears completedAt without losing the
// completion that already happened.
export const applyStatusTransition = ({
  previousStatus,
  nextStatus,
  previousCompletedAt,
  history,
  actorMemberId,
  now,
}: {
  previousStatus: TaskStatus | null;
  nextStatus: TaskStatus;
  previousCompletedAt: string | null;
  history: HistoryEntry[] | null;
  actorMemberId: string | null;
  now: string;
}): {
  completedAt: string | null;
  history: HistoryEntry[] | null;
  isNewlyCompleted: boolean;
} => {
  if (previousStatus === nextStatus) {
    return {
      completedAt: previousCompletedAt,
      history,
      isNewlyCompleted: false,
    };
  }

  const isNewlyCompleted = nextStatus === 'COMPLETED';

  return {
    completedAt: isNewlyCompleted ? now : null,
    history: appendHistory(history, {
      actorMemberId,
      action: previousStatus === null ? 'CREATED' : 'STATUS_CHANGED',
      from: previousStatus,
      to: nextStatus,
      at: now,
    }),
    isNewlyCompleted,
  };
};

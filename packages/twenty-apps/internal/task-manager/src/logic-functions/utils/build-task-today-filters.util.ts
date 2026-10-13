import {
  type TaskTodaySection,
  type TaskTodayWindow,
} from '../../types/task-today';
import { type IssueStatusRow } from '../../types/task-manager-rows';
import { buildProjectScopeFilter } from '../app-scope/build-project-scope-filter.util';

export const buildTaskTodayFilters = ({
  memberId,
  visibleProjectIds,
  issueStatuses,
  window,
  now,
}: {
  memberId: string;
  visibleProjectIds: string[] | null;
  issueStatuses: IssueStatusRow[];
  window: TaskTodayWindow;
  now: Date;
}): Record<TaskTodaySection, Record<string, unknown>> => {
  const doneStatusIds = issueStatuses
    .filter((status) => status.category === 'DONE')
    .map((status) => status.id);
  const startedStatusIds = issueStatuses
    .filter((status) => status.category === 'STARTED')
    .map((status) => status.id);
  const personalFilter = {
    ...buildProjectScopeFilter(visibleProjectIds),
    assigneeId: { eq: memberId },
  };
  // SQL NOT IN excludes NULL, but an issue without a status is still open.
  const openFilter = {
    ...personalFilter,
    ...(doneStatusIds.length === 0
      ? {}
      : {
          or: [
            { statusId: { is: 'NULL' } },
            { not: { statusId: { in: doneStatusIds } } },
          ],
        }),
  };
  return {
    overdue: { ...openFilter, dueDate: { lt: window.startOfDay } },
    today: {
      ...openFilter,
      and: [
        { dueDate: { gte: window.startOfDay } },
        { dueDate: { lt: window.nextDay } },
      ],
    },
    upcoming: {
      ...openFilter,
      and: [
        { dueDate: { gte: window.nextDay } },
        { dueDate: { lt: window.upcomingEnd } },
      ],
    },
    inProgress: { ...personalFilter, statusId: { in: startedStatusIds } },
    noDueDate: { ...openFilter, dueDate: { is: 'NULL' } },
    recentlyDone: {
      ...personalFilter,
      statusId: { in: doneStatusIds },
      updatedAt: {
        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  };
};

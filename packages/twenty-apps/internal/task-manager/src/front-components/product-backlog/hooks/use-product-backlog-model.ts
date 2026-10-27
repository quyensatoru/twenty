import { useMemo } from 'react';

import {
  type LinkedIssueSummary,
  type ProductBacklogData,
  type ProductEpic,
  type StrategicGoal,
  type ProductItem,
  type ProductSprint,
} from '../../../types/product-backlog';
import { type BoardMember, type BoardStatus } from '../../../types/task-board';
import { averageVelocity } from '../../../utils/product-backlog/backlog-metrics.util';
import {
  type ItemReadiness,
  listUnresolvedBlockers,
  readItemReadiness,
} from '../../../utils/product-backlog/item-readiness.util';
import { type PrioritizationTemplate } from '../../../utils/product-backlog/prioritization-template.util';
import {
  findPrioritizationTemplate,
  type ScoredProductItem,
  scoreItem,
} from '../../../utils/product-backlog/prioritization-templates.util';

export type ProductBacklogModel = {
  template: PrioritizationTemplate;
  statusesById: Map<string, BoardStatus>;
  doneStatusIds: ReadonlySet<string>;
  linkedIssuesById: ReadonlyMap<string, LinkedIssueSummary>;
  membersById: Map<string, BoardMember>;
  epicsById: Map<string, ProductEpic>;
  goalsById: Map<string, StrategicGoal>;
  // Items with no sprint, in rank order: the backlog proper.
  backlogItems: ProductItem[];
  // Sprints still to run, in plan order.
  futureSprints: ProductSprint[];
  activeSprint: ProductSprint | undefined;
  averageVelocityPoints: number;
  readinessOf: (item: ProductItem) => ItemReadiness;
  scoreOf: (item: ProductItem) => ScoredProductItem;
  blockersOf: (item: ProductItem) => LinkedIssueSummary[];
};

// Everything the tabs derive from the loaded backlog, computed once per load
// so a row does not redo readiness or scoring on every render.
export const useProductBacklogModel = (
  data: ProductBacklogData | null,
): ProductBacklogModel | null =>
  useMemo(() => {
    if (data === null) {
      return null;
    }

    const template = findPrioritizationTemplate(data.settings.activeTemplateId);
    const statusesById = new Map(
      data.issueStatuses.map((status) => [status.id, status]),
    );
    const doneStatusIds = new Set(
      data.issueStatuses
        .filter((status) => status.category === 'DONE')
        .map((status) => status.id),
    );
    const linkedIssuesById = new Map<string, LinkedIssueSummary>(
      [...data.linkedIssues, ...data.activeSprintIssues, ...data.items].map(
        (issue) => [issue.id, issue],
      ),
    );
    const membersById = new Map(
      [...data.assignableMembers, ...data.members].map((member) => [
        member.id,
        member,
      ]),
    );
    const readinessCache = new Map<string, ItemReadiness>();
    const scoreCache = new Map<string, ScoredProductItem>();

    const readinessOf = (item: ProductItem) => {
      const cached = readinessCache.get(item.id);

      if (cached !== undefined) {
        return cached;
      }

      const readiness = readItemReadiness({
        item,
        settings: data.settings,
        linkedIssuesById,
        doneStatusIds,
      });

      readinessCache.set(item.id, readiness);

      return readiness;
    };

    const scoreOf = (item: ProductItem) => {
      const cached = scoreCache.get(item.id);

      if (cached !== undefined) {
        return cached;
      }

      const scored = scoreItem(item, template, data.settings);

      scoreCache.set(item.id, scored);

      return scored;
    };

    return {
      template,
      statusesById,
      doneStatusIds,
      linkedIssuesById,
      membersById,
      epicsById: new Map(data.epics.map((epic) => [epic.id, epic])),
      goalsById: new Map(data.settings.goals.map((goal) => [goal.id, goal])),
      backlogItems: data.items.filter(
        (item) => item.stage === 'ITEM' && typeof item.sprintId !== 'string',
      ),
      futureSprints: data.sprints.filter(
        (sprint) => sprint.state === 'FUTURE' || sprint.state === null,
      ),
      activeSprint: data.sprints.find((sprint) => sprint.state === 'ACTIVE'),
      averageVelocityPoints: averageVelocity(data.velocity),
      readinessOf,
      scoreOf,
      blockersOf: (item) =>
        listUnresolvedBlockers({ item, linkedIssuesById, doneStatusIds }),
    };
  }, [data]);

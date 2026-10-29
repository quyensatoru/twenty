import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  SET_ISSUE_STAGE_LOGIC_FUNCTION_UID,
  SET_ISSUE_STAGE_ROUTE_PATH,
} from '../constants/product-backlog';
import { type IssueStage } from '../types/product-backlog';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { findActiveSprintId } from './utils/find-active-sprint-id.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import {
  ensureBacklogStatusId,
  ensurePlannedStatusId,
  moveIssueFamiliesToStage,
} from './utils/product-backlog-stage.util';
import { assertProductBacklogEditor } from './utils/resolve-product-backlog-access.util';
import { recordIssueHistories } from './utils/record-issue-histories.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type SetIssueStageBody = {
  issueIds?: unknown;
  stage?: unknown;
};

type IssueRow = {
  id: string;
  projectId?: string | null;
  parentId?: string | null;
  sprintId?: string | null;
  stage?: string | null;
  appId?: string | null;
};

const STAGES: readonly IssueStage[] = ['ITEM', 'ISSUE', 'ARCHIVED'];

const readIssueIds = (value: unknown): string[] => {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((id): id is string => typeof id === 'string' && id !== '')
  ) {
    throw new Error('issueIds must be a non-empty list of issue ids.');
  }

  return [...new Set(value)];
};

// Moves top-level issues, with their subtasks, between the Product Backlog and
// the Board. To the Board they land in PLANNED, inside the running sprint when
// there is one. An issue returned from the Board leaves its sprint, whatever
// its state, and takes the Backlog status; an archived item restored keeps
// its place.
const handler = async (event: RoutePayload<SetIssueStageBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    assertProductBacklogEditor(scope);

    const issueIds = readIssueIds(event.body?.issueIds);
    const stage = STAGES.find((candidate) => candidate === event.body?.stage);

    if (stage === undefined) {
      throw new Error(`stage must be one of ${STAGES.join(', ')}.`);
    }

    for (const issueId of issueIds) {
      await assertRecordInScope({
        client,
        scope,
        objectNameSingular: 'issue',
        recordId: issueId,
        operation: 'write',
      });
    }

    const issues = await listScopedRecords<IssueRow>({
      client,
      pluralName: 'issues',
      filter: { id: { in: issueIds } },
      selection: {
        id: true,
        projectId: true,
        parentId: true,
        sprintId: true,
        stage: true,
        appId: true,
      },
    });
    const projectIds = new Set(issues.map((issue) => issue.projectId));

    if (issues.length !== issueIds.length || projectIds.size !== 1) {
      throw new Error('Pick issues of one project.');
    }

    if (issues.some((issue) => typeof issue.parentId === 'string')) {
      throw new Error('A subtask follows its parent; move the parent instead.');
    }

    const projectId = issues[0].projectId as string;
    const activeSprintId = await findActiveSprintId({ client, projectId });

    if (stage === 'ISSUE') {
      const statusId = await ensurePlannedStatusId(client, projectId);

      await moveIssueFamiliesToStage({
        client,
        issueIds,
        stage,
        extraData: {
          statusId,
          ...(activeSprintId === null ? {} : { sprintId: activeSprintId }),
        },
      });

      return { stage, statusId, sprintId: activeSprintId };
    }

    const returningIssues =
      stage === 'ITEM'
        ? issues.filter((issue) => (issue.stage ?? 'ISSUE') === 'ISSUE')
        : [];

    if (returningIssues.length > 0) {
      const backlogStatusId = await ensureBacklogStatusId(client, projectId);

      await moveIssueFamiliesToStage({
        client,
        issueIds: returningIssues.map((issue) => issue.id),
        stage,
        extraData: { sprintId: null, statusId: backlogStatusId },
      });
      await recordIssueHistories({
        client,
        issues: returningIssues,
        action: 'returned-to-backlog',
        authorId: scope.workspaceMemberId,
      });
    }

    const remainingIssues = issues.filter(
      (issue) => !returningIssues.includes(issue),
    );
    const leavingSprintIds = remainingIssues
      .filter(
        (issue) =>
          stage === 'ARCHIVED' ||
          (activeSprintId !== null && issue.sprintId === activeSprintId),
      )
      .map((issue) => issue.id);

    await moveIssueFamiliesToStage({
      client,
      issueIds: leavingSprintIds,
      stage,
      extraData: { sprintId: null },
    });
    await moveIssueFamiliesToStage({
      client,
      issueIds: remainingIssues
        .map((issue) => issue.id)
        .filter((issueId) => !leavingSprintIds.includes(issueId)),
      stage,
    });

    return { stage };
  });

export default defineLogicFunction({
  universalIdentifier: SET_ISSUE_STAGE_LOGIC_FUNCTION_UID,
  name: 'set-issue-stage',
  description:
    'Route: pushes backlog items to the Board, returns issues to the Product Backlog, or archives items.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: SET_ISSUE_STAGE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});

import {
  PRODUCT_BACKLOG_EDITOR_ROLES_VARIABLE,
  PRODUCT_BACKLOG_HIDDEN_ROLES_VARIABLE,
} from '../../constants/application-variables';
import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import {
  type ProductBacklogAccess,
  readProductBacklogAccess,
} from '../../utils/read-product-backlog-access.util';
import { AppScopePermissionDeniedError } from '../app-scope/app-scope-error';
import { fetchRecordColumn } from './fetch-record-column.util';

export const resolveProductBacklogAccess = (
  scope: CallerScope,
): ProductBacklogAccess =>
  readProductBacklogAccess({
    roles: scope.roles,
    canBypassAppScope: scope.canBypassAppScope,
    editorRoles: process.env[PRODUCT_BACKLOG_EDITOR_ROLES_VARIABLE],
    hiddenRoles: process.env[PRODUCT_BACKLOG_HIDDEN_ROLES_VARIABLE],
  });

// The Product Backlog's own writes: only editor roles and admins.
export const assertProductBacklogEditor = (scope: CallerScope): void => {
  if (resolveProductBacklogAccess(scope) !== 'EDIT') {
    throw new AppScopePermissionDeniedError();
  }
};

// Item fields only the Product Backlog edits; changing them on any issue, or
// changing anything on an item, takes an editor role.
const PRODUCT_ONLY_ISSUE_FIELDS = [
  'stage',
  'strategicGoalId',
  'requestSource',
  'bugSeverity',
  'whyNow',
  'successMetric',
  'userStory',
  'acceptanceCriteria',
  'readinessChecks',
  'blockedByIssueIds',
  'priorityScores',
  'scoreReasoning',
  'refinedAt',
] as const;

// The Board's issue routes also reach items (the issue modal opens both), so
// they ask here before touching a record that is not a plain issue yet.
export const assertIssueWriteAllowed = async ({
  client,
  scope,
  issueId,
  data = {},
}: {
  client: ApiClient;
  scope: CallerScope;
  issueId: string | null;
  data?: Record<string, unknown>;
}): Promise<void> => {
  if (resolveProductBacklogAccess(scope) === 'EDIT') {
    return;
  }

  const touchesProductFields = PRODUCT_ONLY_ISSUE_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(data, field),
  );
  const stage =
    issueId === null
      ? null
      : await fetchRecordColumn(client, 'issues', issueId, 'stage');

  if (touchesProductFields || (stage !== null && stage !== 'ISSUE')) {
    throw new AppScopePermissionDeniedError();
  }
};

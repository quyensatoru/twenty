import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { listScopedRecords } from './list-scoped-records.util';

// An issue's place in the plan: its sprint and its epic. In Jira a subtask
// has no plan of its own; it sits wherever its parent does.
export type IssuePlanning = {
  sprintId: string | null;
  epicId: string | null;
};

export const SUBTASK_PLANNING_MESSAGE =
  "A subtask takes its parent's sprint and epic. Change them on the parent.";

// The sprint and epic a write sets, as given: a key that is absent is left
// alone, an empty or non-string value clears the field.
export const pickPlanningChanges = (
  data: Record<string, unknown>,
): Partial<IssuePlanning> => {
  const changes: Partial<IssuePlanning> = {};

  for (const key of ['sprintId', 'epicId'] as const) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];

      changes[key] = typeof value === 'string' && value !== '' ? value : null;
    }
  }

  return changes;
};

export const fetchIssuePlanning = async (
  client: ApiClient,
  issueId: string,
): Promise<(IssuePlanning & { parentId: string | null }) | null> => {
  const result = await client.query({
    issues: {
      __args: { filter: { id: { eq: issueId } }, first: 1 },
      edges: {
        node: { id: true, parentId: true, sprintId: true, epicId: true },
      },
    },
  });
  const node = (
    result?.issues as
      | Connection<{
          parentId?: string | null;
          sprintId?: string | null;
          epicId?: string | null;
        }>
      | undefined
  )?.edges?.[0]?.node;

  return node === undefined
    ? null
    : {
        parentId: node.parentId ?? null,
        sprintId: node.sprintId ?? null,
        epicId: node.epicId ?? null,
      };
};

// Carries a parent's new sprint or epic down to its subtasks.
export const applyPlanningToSubtasks = async ({
  client,
  parentId,
  changes,
}: {
  client: ApiClient;
  parentId: string;
  changes: Partial<IssuePlanning>;
}): Promise<void> => {
  if (Object.keys(changes).length === 0) {
    return;
  }

  const subtasks = await listScopedRecords<{ id: string }>({
    client,
    pluralName: 'issues',
    filter: { parentId: { eq: parentId } },
    selection: { id: true },
  });

  for (const subtask of subtasks) {
    await client.mutation({
      updateIssue: { __args: { id: subtask.id, data: changes }, id: true },
    });
  }
};

import { type ApiClient } from '../../types/api-client';
import { fetchRecordColumn } from './fetch-record-column.util';

// A sprint or epic is per project: putting an issue into another project's
// sprint would show it on a board it does not belong to. Drag and drop makes
// that one wrong id away, so every issue write that sets either is checked.
export const assertIssuePlanningTargets = async ({
  client,
  projectId,
  sprintId,
  epicId,
}: {
  client: ApiClient;
  projectId: string | null;
  sprintId: unknown;
  epicId: unknown;
}): Promise<void> => {
  const targets = [
    typeof sprintId === 'string'
      ? {
          pluralName: 'sprints',
          id: sprintId,
          message: 'This sprint belongs to another project.',
        }
      : null,
    typeof epicId === 'string'
      ? {
          pluralName: 'epics',
          id: epicId,
          message: 'This epic belongs to another project.',
        }
      : null,
  ];

  for (const target of targets) {
    if (target === null) {
      continue;
    }

    const targetProjectId = await fetchRecordColumn(
      client,
      target.pluralName,
      target.id,
      'projectId',
    );

    if (projectId === null || targetProjectId !== projectId) {
      throw new Error(target.message);
    }
  }
};

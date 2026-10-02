import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_PROJECT_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';
import { createProjectBoardView } from './utils/create-project-board-view.util';
import { generateUniqueProjectKey } from './utils/generate-unique-project-key.util';
import { readErrorMessage } from './utils/read-error-message.util';
import { seedDefaultIssueStatuses } from './utils/seed-default-issue-statuses.util';

type ProjectRow = {
  name?: string | null;
  key?: string | null;
  appId?: string | null;
};

type ProjectCreateEvent = {
  recordId: string;
  properties: { after: ProjectRow };
};

// A project is useless until it has statuses, and the fork seeded them from a
// post-hook so every way of creating one was covered. This is that hook: it
// also derives the key, and builds the project's own Kanban so the board of
// Twenty is usable straight away.
//
// Every step is skipped when the value is already there, so a project created
// through the create-project route is left alone.
const handler = async (event: DatabaseEventPayload<ProjectCreateEvent>) => {
  const client = createAppClient();
  const project = event.properties.after;
  const projectId = event.recordId;

  // Collision-aware, like the route it replaces: two projects whose names
  // start the same must not end up sharing an issue key prefix.
  const key =
    typeof project.key === 'string' && project.key.length > 0
      ? project.key
      : await generateUniqueProjectKey({ client, name: project.name ?? '' });

  if (key !== (project.key ?? '')) {
    await client.mutation({
      updateProject: { __args: { id: projectId, data: { key } }, id: true },
    });
  }

  const statuses = await seedDefaultIssueStatuses({ client, projectId });

  // The board is a convenience, not part of the record being correct: a
  // workspace that already carries a view of its own should not lose a project
  // because the view could not be built.
  let viewId: string | null = null;
  let viewError: string | null = null;

  try {
    viewId = (await createProjectBoardView({ client, projectId })).viewId;
  } catch (error) {
    viewError = readErrorMessage(error);
  }

  return { key, statusCount: statuses.length, viewId, viewError };
};

export default defineLogicFunction({
  universalIdentifier: ON_PROJECT_CREATED_LOGIC_FUNCTION_UID,
  name: 'prepare-project-on-created',
  description:
    'Derives the project key, seeds the default issue statuses and builds the project Kanban view.',
  timeoutSeconds: 120,
  databaseEventTriggerSettings: { eventName: 'project.created' },
  handler,
});

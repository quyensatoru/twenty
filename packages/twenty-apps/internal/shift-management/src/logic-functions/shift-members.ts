import { defineLogicFunction } from 'twenty-sdk/define';

import { SHIFT_MEMBERS_ROUTE_PATH } from '../constants/route-paths';
import { SHIFT_MEMBERS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';
import { listWorkspaceMembers } from './utils/list-workspace-members.util';
import { readActor } from './utils/read-actor.util';

// Feeds the Report page's member picker, which only a Leader/PO sees. A
// non-elevated caller gets an empty list rather than an error: the Report page
// simply renders without the picker, locked to the caller's own report.
const handler = async (
  _event: unknown,
  context: { workspaceMemberId: string | null },
) => {
  try {
    const actor = await readActor(context.workspaceMemberId);

    if (!actor.isElevated) {
      return { success: true, members: [], isElevated: false };
    }

    return {
      success: true,
      members: await listWorkspaceMembers(createAppClient()),
      isElevated: true,
    };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: SHIFT_MEMBERS_LOGIC_FUNCTION_UID,
  name: 'shift-members',
  description: 'Route: workspace members a Leader/PO can report on.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SHIFT_MEMBERS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});

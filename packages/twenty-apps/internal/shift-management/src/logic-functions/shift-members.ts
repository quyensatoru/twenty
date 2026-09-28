import { defineLogicFunction } from 'twenty-sdk/define';

import { SHIFT_MEMBERS_ROUTE_PATH } from '../constants/route-paths';
import { SHIFT_MEMBERS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';
import { listWorkspaceMembers } from './utils/list-workspace-members.util';
import { readActor } from './utils/read-actor.util';

// Who the caller is, plus the member list the Report page's picker needs. Only
// a Leader/PO gets the list; a non-elevated caller gets an empty one rather
// than an error, so the Report page just renders without the picker, locked to
// the caller's own report. Every page also reads `workspaceMemberId` from here
// to tell its own coverage apart from the team's.
const handler = async (
  _event: unknown,
  context: { workspaceMemberId: string | null },
) => {
  try {
    const actor = await readActor(context.workspaceMemberId);

    if (!actor.isElevated) {
      return {
        success: true,
        members: [],
        isElevated: false,
        workspaceMemberId: actor.workspaceMemberId,
      };
    }

    return {
      success: true,
      members: await listWorkspaceMembers(createAppClient()),
      isElevated: true,
      workspaceMemberId: actor.workspaceMemberId,
    };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: SHIFT_MEMBERS_LOGIC_FUNCTION_UID,
  name: 'shift-members',
  description:
    'Route: the calling member, and the members a Leader/PO can report on.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SHIFT_MEMBERS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});

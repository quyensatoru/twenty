import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_APP_ACCESS_CHANGED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';
import { syncMemberScopedAppIds } from './utils/sync-member-scoped-app-ids.util';

type AppAccessRow = { memberId?: string | null };

type AppAccessChangeEvent = {
  recordId: string;
  properties: { before?: AppAccessRow | null; after?: AppAccessRow | null };
};

// Grants are stored as appAccess rows, but permissions are enforced against
// the mirror on workspaceMember, so a grant that changes without this running
// changes nothing — including a revoked one, which is the dangerous direction.
//
// Registered on `appAccess.*`: create, update and delete all move the mirror.
// An update can move a grant between members, so both sides are resynced.
const handler = async (event: DatabaseEventPayload<AppAccessChangeEvent>) => {
  const client = createAppClient();
  const memberIds = [
    event.properties.after?.memberId,
    event.properties.before?.memberId,
  ].filter(
    (memberId, index, all): memberId is string =>
      typeof memberId === 'string' && all.indexOf(memberId) === index,
  );

  const syncedMemberIds: string[] = [];

  for (const memberId of memberIds) {
    if (await syncMemberScopedAppIds({ client, memberId })) {
      syncedMemberIds.push(memberId);
    }
  }

  return { syncedMemberIds };
};

export default defineLogicFunction({
  universalIdentifier: ON_APP_ACCESS_CHANGED_LOGIC_FUNCTION_UID,
  name: 'sync-scope-on-app-access-changed',
  description:
    "Recomputes a member's scopedAppIds mirror whenever their App Access grants change.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'appAccess.*' },
  handler,
});

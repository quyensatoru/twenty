import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CLIENT_SAVE_ROUTE_PATH } from '../constants/route-paths';
import { CLIENT_SAVE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import {
  type MerchantRecord,
  type VipClientRecord,
} from '../types/bc-records';
import { type BcScope } from '../types/bc-scope';
import { type ClientSaveRequest } from '../types/dashboard';
import {
  loadScopedVipClient,
  normalizeShopDomain,
} from './utils/client-store.util';
import { assertCanEditClient } from './utils/dashboard-data.util';
import { listAllRecords } from './utils/list-all-records.util';
import { recomputeClientStatus } from './utils/recompute-client-status.util';
import {
  VIP_CLIENT_SELECTION,
} from './utils/record-selections';
import {
  createRecord,
  findFirstRecord,
  updateRecord,
} from './utils/record-store.util';
import { resolveMerchantSelection } from './utils/merchant-fields.util';
import { runBcRoute } from './utils/run-bc-route.util';

const assertCanAssign = (scope: BcScope, picId: string | null): void => {
  if (!scope.canReassignPic) {
    throw new Error('Not authorized: only BC managers can assign or reassign a PIC.');
  }

  if (
    picId !== null &&
    scope.visibleMemberIds !== null &&
    !scope.visibleMemberIds.includes(picId)
  ) {
    throw new Error('Not authorized: you can only assign clients to BCs of your own team.');
  }
};

const readMemberTeamId = async (
  client: ApiClient,
  workspaceMemberId: string,
): Promise<string | null> =>
  (
    await findFirstRecord<{ teamId: string | null }>({
      client,
      objectNamePlural: 'bcMembers',
      filter: { memberId: { eq: workspaceMemberId }, isActive: { eq: true } },
      selection: { teamId: true },
    })
  )?.teamId ?? null;

// The owning team follows the PIC. Without one, an admin's choice or the
// team the manager runs keeps the client visible to that team only.
const resolveClientTeamId = async ({
  client,
  scope,
  picId,
  requestedTeamId,
  currentTeamId,
}: {
  client: ApiClient;
  scope: BcScope;
  picId: string | null;
  requestedTeamId: string | null;
  currentTeamId: string | null;
}): Promise<string | null> => {
  if (picId !== null) {
    const picTeamId = await readMemberTeamId(client, picId);

    if (picTeamId !== null) {
      return picTeamId;
    }
  }

  if (scope.role === 'ADMIN') {
    return requestedTeamId ?? currentTeamId;
  }

  if (requestedTeamId !== null && scope.managedTeamIds.includes(requestedTeamId)) {
    return requestedTeamId;
  }

  return currentTeamId !== null && scope.managedTeamIds.includes(currentTeamId)
    ? currentTeamId
    : (scope.managedTeamIds[0] ?? null);
};

const readText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// Every app install of the shop becomes one subscription of the client.
const linkShopMerchants = async (
  client: ApiClient,
  vipClientId: string,
  shopDomain: string,
): Promise<MerchantRecord[]> => {
  const merchants = await listAllRecords<MerchantRecord>({
    client,
    pluralName: 'merchants',
    filter: { name: { ilike: shopDomain.replace(/[\\%_]/g, '\\$&') } },
    selection: await resolveMerchantSelection(client),
  });

  for (const merchant of merchants) {
    if (merchant.vipClientId !== vipClientId) {
      await updateRecord({
        client,
        objectNameSingular: 'merchant',
        id: merchant.id,
        data: { vipClientId },
      });
    }
  }

  return merchants;
};

const createClient = async (
  client: ApiClient,
  scope: BcScope,
  body: ClientSaveRequest,
): Promise<VipClientRecord> => {
  if (scope.role !== 'ADMIN' && scope.role !== 'MANAGER') {
    throw new Error('Not authorized: only BC managers can add VIP clients.');
  }

  const rawDomain = readText(body.shopDomain);

  if (rawDomain === null) {
    throw new Error('Enter the Shopify domain of the client.');
  }

  const shopDomain = normalizeShopDomain(rawDomain);
  const picId = readText(body.picId);

  assertCanAssign(scope, picId);

  const existing = await findFirstRecord<VipClientRecord>({
    client,
    objectNamePlural: 'vipClients',
    filter: { shopDomain: { eq: shopDomain } },
    selection: VIP_CLIENT_SELECTION,
  });

  if (existing !== null) {
    throw new Error('This shop is already a VIP client.');
  }

  const now = new Date().toISOString();
  const teamId = await resolveClientTeamId({
    client,
    scope,
    picId,
    requestedTeamId: readText(body.teamId),
    currentTeamId: null,
  });
  const vipClient = await createRecord<VipClientRecord>({
    client,
    objectNameSingular: 'vipClient',
    data: {
      name: readText(body.name) ?? shopDomain,
      shopDomain,
      picId,
      teamId,
      picAssignedById: picId === null ? null : scope.workspaceMemberId,
      assignedAt: picId === null ? null : now,
      notes: readText(body.notes),
      relationshipStatus: 'ACTIVE',
      statusChangedAt: now,
    },
    selection: VIP_CLIENT_SELECTION,
  });

  const merchants = await linkShopMerchants(client, vipClient.id, shopDomain);
  const storeName = merchants.find((merchant) => readText(merchant.storeName) !== null)?.storeName;

  if (readText(body.name) === null && typeof storeName === 'string') {
    await updateRecord({
      client,
      objectNameSingular: 'vipClient',
      id: vipClient.id,
      data: { name: storeName.trim() },
    });
  }

  await recomputeClientStatus({
    client,
    vipClientId: vipClient.id,
    actorMemberId: scope.workspaceMemberId,
    now,
  });

  return vipClient;
};

const updateClient = async (
  client: ApiClient,
  scope: BcScope,
  body: ClientSaveRequest & { vipClientId: string },
): Promise<VipClientRecord> => {
  const vipClient = await loadScopedVipClient({
    client,
    scope,
    vipClientId: body.vipClientId,
  });
  const data: Record<string, unknown> = {};

  if (body.name !== undefined || body.notes !== undefined) {
    assertCanEditClient(scope, vipClient);

    if (body.name !== undefined) {
      const name = readText(body.name);

      if (name === null) {
        throw new Error('The client name cannot be empty.');
      }

      data.name = name;
    }

    if (body.notes !== undefined) {
      data.notes = readText(body.notes);
    }
  }

  if (body.picId !== undefined) {
    const picId = readText(body.picId);

    if (picId !== vipClient.picId) {
      assertCanAssign(scope, picId);
      data.picId = picId;
      // Written with the PIC so the PIC-change trigger can record who did it.
      data.picAssignedById = scope.workspaceMemberId;
      data.assignedAt = picId === null ? null : new Date().toISOString();
      data.teamId = await resolveClientTeamId({
        client,
        scope,
        picId,
        requestedTeamId: readText(body.teamId),
        currentTeamId: vipClient.teamId,
      });
    }
  } else if (body.teamId !== undefined && scope.role === 'ADMIN') {
    data.teamId = readText(body.teamId);
  }

  if (Object.keys(data).length === 0) {
    return vipClient;
  }

  return updateRecord<VipClientRecord>({
    client,
    objectNameSingular: 'vipClient',
    id: vipClient.id,
    data,
    selection: VIP_CLIENT_SELECTION,
  });
};

const handler = async (event: RoutePayload<ClientSaveRequest>) =>
  runBcRoute(async ({ client, scope }) => {
    const body = event.body ?? { vipClientId: null };
    const vipClientId = readText(body.vipClientId);

    const vipClient =
      vipClientId === null
        ? await createClient(client, scope, body)
        : await updateClient(client, scope, { ...body, vipClientId });

    return { vipClient };
  });

export default defineLogicFunction({
  universalIdentifier: CLIENT_SAVE_LOGIC_FUNCTION_UID,
  name: 'bc-client-save',
  description:
    "Route: adds a shop as a VIP client and links its app installs, or changes a client's name, notes or PIC.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: CLIENT_SAVE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});

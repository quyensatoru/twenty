import { type ApiClient } from '../../types/api-client';
import {
  type BcActivityRecord,
  type BcMemberRecord,
  type BcOpportunityRecord,
  type BcPlanRecord,
  type MerchantRecord,
  type VipClientRecord,
} from '../../types/bc-records';
import { type AttributionActivity } from '../../utils/automation-attribution.util';
import { normalizeShopDomain } from './client-store.util';
import { listAllRecords } from './list-all-records.util';
import {
  normalizeMerchant,
  resolveMerchantSelection,
} from './merchant-fields.util';
import {
  BC_ACTIVITY_SELECTION,
  BC_OPPORTUNITY_SELECTION,
  BC_PLAN_SELECTION,
  VIP_CLIENT_SELECTION,
} from './record-selections';
import { findFirstRecord } from './record-store.util';
import { BC_MEMBER_SELECTION } from './resolve-bc-scope.util';

const DAY_MS = 86_400_000;

export const findVipClientByShopDomain = async (
  client: ApiClient,
  shopDomain: string | null | undefined,
): Promise<VipClientRecord | null> => {
  if (typeof shopDomain !== 'string' || shopDomain.trim().length === 0) {
    return null;
  }

  return findFirstRecord<VipClientRecord>({
    client,
    objectNamePlural: 'vipClients',
    filter: { shopDomain: { eq: normalizeShopDomain(shopDomain) } },
    selection: VIP_CLIENT_SELECTION,
  });
};

export const readMerchant = async (
  client: ApiClient,
  merchantId: string,
): Promise<MerchantRecord | null> => {
  const merchant = await findFirstRecord<MerchantRecord>({
    client,
    objectNamePlural: 'merchants',
    filter: { id: { eq: merchantId } },
    selection: await resolveMerchantSelection(client),
  });

  return merchant === null ? null : normalizeMerchant(merchant);
};

export const listPlanCatalog = (client: ApiClient): Promise<BcPlanRecord[]> =>
  listAllRecords<BcPlanRecord>({
    client,
    pluralName: 'bcPlans',
    selection: BC_PLAN_SELECTION,
  });

export const listActiveBcMembers = (client: ApiClient): Promise<BcMemberRecord[]> =>
  listAllRecords<BcMemberRecord>({
    client,
    pluralName: 'bcMembers',
    filter: { isActive: { eq: true } },
    selection: BC_MEMBER_SELECTION,
  });

// BC-authored activity of one client inside the window before an event: the
// only evidence an upgrade or review credit may rest on.
export const listBcActivitiesBefore = async ({
  client,
  vipClientId,
  eventAt,
  windowDays,
}: {
  client: ApiClient;
  vipClientId: string;
  eventAt: string;
  windowDays: number;
}): Promise<AttributionActivity[]> =>
  listAllRecords<BcActivityRecord>({
    client,
    pluralName: 'bcActivities',
    filter: {
      vipClientId: { eq: vipClientId },
      isBcAuthored: { eq: true },
      and: [
        {
          occurredAt: {
            gte: new Date(Date.parse(eventAt) - windowDays * DAY_MS).toISOString(),
          },
        },
        { occurredAt: { lt: eventAt } },
      ],
    },
    selection: BC_ACTIVITY_SELECTION,
    maxRecords: 2_000,
  });

export const listOpenOpportunities = async ({
  client,
  vipClientId,
  appName,
}: {
  client: ApiClient;
  vipClientId: string;
  appName: string | null;
}): Promise<BcOpportunityRecord[]> => {
  const opportunities = await listAllRecords<BcOpportunityRecord>({
    client,
    pluralName: 'bcOpportunities',
    filter: { vipClientId: { eq: vipClientId }, status: { eq: 'OPEN' } },
    selection: BC_OPPORTUNITY_SELECTION,
  });

  return opportunities.filter(
    (opportunity) =>
      appName === null ||
      (opportunity.appName ?? '').toUpperCase() === appName.toUpperCase(),
  );
};

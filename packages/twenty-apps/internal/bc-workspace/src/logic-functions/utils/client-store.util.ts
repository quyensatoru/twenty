import { type ApiClient } from '../../types/api-client';
import {
  type BcIssueRecord,
  type MerchantRecord,
  type VipClientRecord,
} from '../../types/bc-records';
import { type BcScope } from '../../types/bc-scope';
import { listAllRecords } from './list-all-records.util';
import {
  normalizeMerchant,
  resolveMerchantSelection,
} from './merchant-fields.util';
import {
  BC_ISSUE_SELECTION,
  VIP_CLIENT_SELECTION,
} from './record-selections';
import { findFirstRecord } from './record-store.util';
import {
  assertCanSeeClient,
  buildVisibleClientFilter,
} from './resolve-bc-scope.util';

export const readVipClient = (
  client: ApiClient,
  vipClientId: string,
): Promise<VipClientRecord | null> =>
  findFirstRecord<VipClientRecord>({
    client,
    objectNamePlural: 'vipClients',
    filter: { id: { eq: vipClientId } },
    selection: VIP_CLIENT_SELECTION,
  });

export const loadScopedVipClient = async ({
  client,
  scope,
  vipClientId,
}: {
  client: ApiClient;
  scope: BcScope;
  vipClientId: string;
}): Promise<VipClientRecord> => {
  const vipClient = await readVipClient(client, vipClientId);

  if (vipClient === null) {
    throw new Error('This client no longer exists.');
  }

  assertCanSeeClient(scope, vipClient.picId, vipClient.teamId);

  return vipClient;
};

export const listVisibleVipClients = (
  client: ApiClient,
  scope: BcScope,
  extraFilter?: Record<string, unknown>,
): Promise<VipClientRecord[]> => {
  const visibleFilter = buildVisibleClientFilter(scope);
  const filters = [visibleFilter, extraFilter ?? null].filter(
    (filter): filter is Record<string, unknown> => filter !== null,
  );

  return listAllRecords<VipClientRecord>({
    client,
    pluralName: 'vipClients',
    filter:
      filters.length === 0
        ? undefined
        : filters.length === 1
          ? filters[0]
          : { and: filters },
    selection: VIP_CLIENT_SELECTION,
  });
};

// Chunked so a large portfolio does not exceed the filter size limits.
const chunk = <TItem>(items: TItem[], size: number): TItem[][] => {
  const chunks: TItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

export const listByVipClientIds = async <TRecord>({
  client,
  pluralName,
  vipClientIds,
  selection,
  extraFilter,
  orderBy,
}: {
  client: ApiClient;
  pluralName: string;
  vipClientIds: string[] | null;
  selection: Record<string, unknown>;
  extraFilter?: Record<string, unknown>;
  orderBy?: unknown;
}): Promise<TRecord[]> => {
  if (vipClientIds === null) {
    return listAllRecords<TRecord>({
      client,
      pluralName,
      filter: extraFilter,
      selection,
      orderBy,
    });
  }

  if (vipClientIds.length === 0) {
    return [];
  }

  const results = await Promise.all(
    chunk(vipClientIds, 200).map((ids) =>
      listAllRecords<TRecord>({
        client,
        pluralName,
        filter: {
          and: [{ vipClientId: { in: ids } }, ...(extraFilter ? [extraFilter] : [])],
        },
        selection,
        orderBy,
      }),
    ),
  );

  return results.flat();
};

export const listClientMerchants = async (
  client: ApiClient,
  vipClientIds: string[] | null,
): Promise<MerchantRecord[]> =>
  (
    await listByVipClientIds<MerchantRecord>({
      client,
      pluralName: 'merchants',
      vipClientIds,
      selection: await resolveMerchantSelection(client),
      extraFilter:
        vipClientIds === null ? { vipClientId: { is: 'NOT_NULL' } } : undefined,
    })
  ).map(normalizeMerchant);

export const listOpenIssues = (
  client: ApiClient,
  vipClientIds: string[] | null,
): Promise<BcIssueRecord[]> =>
  listByVipClientIds<BcIssueRecord>({
    client,
    pluralName: 'bcIssues',
    vipClientIds,
    selection: BC_ISSUE_SELECTION,
    extraFilter: { status: { eq: 'OPEN' } },
  });

export const groupByVipClientId = <TRecord extends { vipClientId: string | null }>(
  records: TRecord[],
): Map<string, TRecord[]> => {
  const grouped = new Map<string, TRecord[]>();

  for (const record of records) {
    if (record.vipClientId === null) {
      continue;
    }

    const list = grouped.get(record.vipClientId) ?? [];

    list.push(record);
    grouped.set(record.vipClientId, list);
  }

  return grouped;
};

export const normalizeShopDomain = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

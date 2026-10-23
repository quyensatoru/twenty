import {
  type DiscountScope,
  type DiscountSyncAction,
  type DiscountSyncResult,
  type DiscountSyncStatus,
  type DiscountType,
} from '../../constants/discount';
import { type ApiClient } from '../../types/api-client';
import {
  type AppErrorItem,
  type DiscountListItem,
  type DiscountSyncLogItem,
} from '../../types/discount';
import { listAllRecords } from './list-all-records.util';

export const DISCOUNT_SELECTION = {
  id: true,
  name: true,
  discountCode: true,
  discountType: true,
  discountValue: true,
  limitInIntervals: true,
  limitUsage: true,
  timesUsed: true,
  startDate: true,
  endDate: true,
  status: true,
  scope: true,
  reason: true,
  assignedDomains: true,
  appId: true,
  merchantId: true,
  syncStatus: true,
  syncError: true,
  syncedAt: true,
  externalId: true,
  syncAttempts: true,
  nextSyncAt: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: { source: true, workspaceMemberId: true, name: true },
  updatedBy: { source: true, workspaceMemberId: true, name: true },
  app: { id: true, name: true },
  merchant: { id: true, name: true },
} as const;

export type DiscountRecord = {
  id: string;
  name?: string | null;
  discountCode?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  limitInIntervals?: number | null;
  limitUsage?: number | null;
  timesUsed?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: boolean | null;
  scope?: DiscountScope | null;
  reason?: string | null;
  assignedDomains?: string[] | null;
  appId?: string | null;
  merchantId?: string | null;
  syncStatus?: DiscountSyncStatus | null;
  syncError?: string | null;
  syncedAt?: string | null;
  externalId?: string | null;
  syncAttempts?: number | null;
  nextSyncAt?: string | null;
  position?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdBy?: { name?: string | null } | null;
  updatedBy?: { name?: string | null } | null;
  app?: { id: string; name?: string | null } | null;
  merchant?: { id: string; name?: string | null } | null;
};

export const toDiscountListItem = (
  record: DiscountRecord,
): DiscountListItem => ({
  id: record.id,
  name: record.name ?? null,
  discountCode: record.discountCode ?? '',
  discountType: record.discountType ?? null,
  discountValue: record.discountValue ?? null,
  limitInIntervals: record.limitInIntervals ?? null,
  limitUsage: record.limitUsage ?? null,
  timesUsed: record.timesUsed ?? null,
  startDate: record.startDate ?? null,
  endDate: record.endDate ?? null,
  status: record.status === true,
  scope: record.scope ?? null,
  reason: record.reason ?? null,
  assignedDomains: record.assignedDomains ?? [],
  appId: record.appId ?? null,
  appName: record.app?.name ?? null,
  merchantId: record.merchantId ?? null,
  merchantName: record.merchant?.name ?? null,
  syncStatus: record.syncStatus ?? null,
  syncError: record.syncError ?? null,
  syncedAt: record.syncedAt ?? null,
  externalId: record.externalId ?? null,
  nextSyncAt: record.nextSyncAt ?? null,
  createdAt: record.createdAt ?? new Date(0).toISOString(),
  createdByName: record.createdBy?.name ?? null,
});

export const listDiscounts = async (
  client: ApiClient,
  filter?: Record<string, unknown>,
): Promise<DiscountRecord[]> =>
  listAllRecords<DiscountRecord>({
    client,
    pluralName: 'discounts',
    filter,
    selection: DISCOUNT_SELECTION,
    orderBy: [{ createdAt: 'DescNullsLast' }],
    maxRecords: 2_000,
  });

export const readDiscount = async (
  client: ApiClient,
  discountId: string,
): Promise<DiscountRecord | null> => {
  const [record] = await listDiscounts(client, { id: { eq: discountId } });

  return record ?? null;
};

export const updateDiscount = async (
  client: ApiClient,
  discountId: string,
  data: Record<string, unknown>,
): Promise<void> => {
  await client.mutation({
    updateDiscount: {
      __args: { id: discountId, data },
      id: true,
    },
  });
};

export type SyncLogInput = {
  discountId: string;
  appName: string | null;
  action: DiscountSyncAction;
  result: DiscountSyncResult;
  httpStatus: number | null;
  durationMs: number | null;
  errors: AppErrorItem[];
  request: unknown;
  response: unknown;
  deliveryId: string;
  triggeredBy: string;
};

// RAW_JSON only stores objects and arrays; an app answering plain text
// ("Service Unavailable") is kept under `text`.
const toJsonValue = (value: unknown): unknown =>
  value === null || value === undefined || typeof value === 'object'
    ? (value ?? null)
    : { text: String(value) };

export const createSyncLog = async (
  client: ApiClient,
  input: SyncLogInput,
): Promise<void> => {
  await client.mutation({
    createDiscountSyncLog: {
      __args: {
        data: {
          name: `${input.appName ?? '?'} · ${input.action} · ${input.result}`,
          discountId: input.discountId,
          appName: input.appName,
          action: input.action,
          result: input.result,
          httpStatus: input.httpStatus,
          durationMs: input.durationMs,
          errors: input.errors,
          request: toJsonValue(input.request),
          response: toJsonValue(input.response),
          deliveryId: input.deliveryId,
          triggeredBy: input.triggeredBy,
        },
      },
      id: true,
    },
  });
};

type SyncLogRecord = {
  id: string;
  appName?: string | null;
  action?: DiscountSyncAction | null;
  result?: DiscountSyncResult | null;
  httpStatus?: number | null;
  durationMs?: number | null;
  errors?: unknown;
  response?: unknown;
  triggeredBy?: string | null;
  createdAt: string;
};

export const listSyncLogs = async (
  client: ApiClient,
  discountId: string,
): Promise<DiscountSyncLogItem[]> => {
  const records = await listAllRecords<SyncLogRecord>({
    client,
    pluralName: 'discountSyncLogs',
    filter: { discountId: { eq: discountId } },
    selection: {
      id: true,
      appName: true,
      action: true,
      result: true,
      httpStatus: true,
      durationMs: true,
      errors: true,
      response: true,
      triggeredBy: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'DescNullsLast' }],
    maxRecords: 50,
  });

  return records.map((record) => ({
    id: record.id,
    appName: record.appName ?? null,
    action: record.action ?? null,
    result: record.result ?? null,
    httpStatus: record.httpStatus ?? null,
    durationMs: record.durationMs ?? null,
    errors: Array.isArray(record.errors)
      ? (record.errors as AppErrorItem[])
      : [],
    response: record.response ?? null,
    triggeredBy: record.triggeredBy ?? null,
    createdAt: record.createdAt,
  }));
};

export const findSyncLogByDeliveryId = async (
  client: ApiClient,
  deliveryId: string,
): Promise<{
  id: string;
  discountId: string;
  appId: string | null;
  appName: string | null;
} | null> => {
  const [record] = await listAllRecords<{
    id: string;
    discountId?: string | null;
    appName?: string | null;
    discount?: { appId?: string | null } | null;
  }>({
    client,
    pluralName: 'discountSyncLogs',
    filter: { deliveryId: { eq: deliveryId } },
    selection: {
      id: true,
      discountId: true,
      appName: true,
      discount: { appId: true },
    },
    maxRecords: 1,
  });

  return record === undefined || typeof record.discountId !== 'string'
    ? null
    : {
        id: record.id,
        discountId: record.discountId,
        appId: record.discount?.appId ?? null,
        appName: record.appName ?? null,
      };
};

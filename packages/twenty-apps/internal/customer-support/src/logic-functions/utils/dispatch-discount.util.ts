import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  DISCOUNT_RETRY_DELAYS_MINUTES,
  type DiscountSyncAction,
  type DiscountSyncResult,
  type DiscountSyncStatus,
} from '../../constants/discount';
import { type ApiClient } from '../../types/api-client';
import { type AppErrorItem } from '../../types/discount';
import {
  buildDeliveryPayload,
  type DeliveryOutcome,
  sendDelivery,
} from './discount-delivery.util';
import {
  createSyncLog,
  type DiscountRecord,
  updateDiscount,
} from './discount-store.util';
import {
  isDiscountSyncEnabled,
  readDiscountAppConnection,
} from './read-discount-settings.util';
import { readErrorMessage } from './read-error-message.util';

// Bookkeeping and joined relations stay on the CRM side; the app gets the
// discount's own columns, as Twenty's web hook used to send them.
const LOCAL_ONLY_KEYS = new Set([
  'syncStatus',
  'syncError',
  'syncedAt',
  'externalId',
  'syncAttempts',
  'nextSyncAt',
  'app',
  'merchant',
  'syncLogs',
  '__typename',
]);

export const toAppRecord = (
  record: DiscountRecord,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([key]) => !LOCAL_ONLY_KEYS.has(key)),
  );

export const toSyncStatus = (
  result: DiscountSyncResult,
): DiscountSyncStatus => {
  switch (result) {
    case 'APPLIED':
      return 'APPLIED';
    case 'REJECTED':
      return 'REJECTED';
    case 'ACCEPTED':
      return 'PENDING';
    case 'NOT_CONNECTED':
      return 'NOT_CONNECTED';
    default:
      return 'FAILED';
  }
};

export const summarizeErrors = (errors: AppErrorItem[]): string | null =>
  errors.length === 0
    ? null
    : errors
        .map((error) =>
          error.field === null ? error.message : `${error.field}: ${error.message}`,
        )
        .join('; ')
        .slice(0, 500);

// The minutes before the next try, or null once the delays are used up.
export const nextRetryDelayMinutes = (attempts: number): number | null =>
  DISCOUNT_RETRY_DELAYS_MINUTES[attempts - 1] ?? null;

let cachedWorkspaceId: string | null = null;

// Events carry the workspace id; a resend or a retry has to look it up.
const readWorkspaceId = async (): Promise<string | null> => {
  if (cachedWorkspaceId !== null) {
    return cachedWorkspaceId;
  }

  try {
    const result = (await new MetadataApiClient().query({
      currentWorkspace: { id: true },
    })) as { currentWorkspace?: { id?: string } };

    cachedWorkspaceId = result.currentWorkspace?.id ?? null;
  } catch {
    cachedWorkspaceId = null;
  }

  return cachedWorkspaceId;
};

export type DispatchInput = {
  client: ApiClient;
  record: DiscountRecord;
  appName: string | null;
  action: DiscountSyncAction;
  triggeredBy: string;
  updatedFields?: string[];
  workspaceId?: string;
  objectMetadataId?: string;
};

export type DispatchResult = {
  syncStatus: DiscountSyncStatus;
  outcome: DeliveryOutcome;
};

const writeOutcome = async ({
  client,
  record,
  action,
  outcome,
  previousAttempts,
}: {
  client: ApiClient;
  record: DiscountRecord;
  action: DiscountSyncAction;
  outcome: DeliveryOutcome;
  previousAttempts: number;
}): Promise<DiscountSyncStatus> => {
  const syncStatus = toSyncStatus(outcome.result);

  // A deleted discount keeps its last state; only the log tells what the app
  // said about the deletion.
  if (action === 'DELETE') {
    return syncStatus;
  }

  const attempts = outcome.isRetryable ? previousAttempts + 1 : 0;
  const retryDelay = outcome.isRetryable ? nextRetryDelayMinutes(attempts) : null;

  await updateDiscount(client, record.id, {
    syncStatus,
    syncError: summarizeErrors(outcome.errors),
    syncAttempts: attempts,
    nextSyncAt:
      retryDelay === null
        ? null
        : new Date(Date.now() + retryDelay * 60_000).toISOString(),
    ...(outcome.result === 'APPLIED'
      ? {
          syncedAt: new Date().toISOString(),
          ...(outcome.externalId === null
            ? {}
            : { externalId: outcome.externalId }),
        }
      : {}),
  });

  return syncStatus;
};

export const dispatchDiscount = async ({
  client,
  record,
  appName,
  action,
  triggeredBy,
  updatedFields,
  workspaceId,
  objectMetadataId,
}: DispatchInput): Promise<DispatchResult> => {
  const connection = await readDiscountAppConnection(record.appId);
  const previousAttempts = record.syncAttempts ?? 0;

  if (connection === null) {
    const outcome: DeliveryOutcome = {
      result: 'NOT_CONNECTED',
      httpStatus: null,
      errors: [
        {
          field: null,
          code: 'not_connected',
          message: `${appName ?? 'This app'} has no discount endpoint configured`,
        },
      ],
      externalId: null,
      response: null,
      isRetryable: false,
    };
    const syncStatus = await writeOutcome({
      client,
      record,
      action,
      outcome,
      previousAttempts,
    });

    return { syncStatus, outcome };
  }

  const payload = buildDeliveryPayload({
    targetUrl: connection.endpoint,
    action,
    workspaceId: workspaceId ?? (await readWorkspaceId()),
    objectMetadataId: objectMetadataId ?? null,
    record: toAppRecord(record),
    updatedFields,
  });
  const sent = await sendDelivery({
    endpoint: connection.endpoint,
    secret: connection.secret,
    payload,
  });

  try {
    await createSyncLog(client, {
      discountId: record.id,
      appName,
      action,
      result: sent.result,
      httpStatus: sent.httpStatus,
      durationMs: sent.durationMs,
      errors: sent.errors,
      request: payload,
      response: sent.response,
      deliveryId: sent.deliveryId,
      triggeredBy,
    });
  } catch (error) {
    // The app already has the discount; losing the log line must not hide
    // that from the status below.
    console.error(`Discount delivery log failed: ${readErrorMessage(error)}`);
  }

  const syncStatus = await writeOutcome({
    client,
    record,
    action,
    outcome: sent,
    previousAttempts,
  });

  return { syncStatus, outcome: sent };
};

export const shouldDispatch = (record: DiscountRecord): boolean =>
  isDiscountSyncEnabled() &&
  record.syncStatus !== 'DRAFT' &&
  typeof record.appId === 'string' &&
  (record.discountCode ?? '').trim().length > 0;

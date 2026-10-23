import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import {
  DISCOUNT_REQUEST_TIMEOUT_MS,
  type DiscountSyncAction,
  type DiscountSyncResult,
} from '../../constants/discount';
import { type AppErrorItem } from '../../types/discount';

export type DiscountEventName =
  | 'discount.created'
  | 'discount.updated'
  | 'discount.deleted';

export const toDiscountEventName = (
  action: DiscountSyncAction,
): DiscountEventName =>
  action === 'CREATE'
    ? 'discount.created'
    : action === 'DELETE'
      ? 'discount.deleted'
      : 'discount.updated';

// Same body as Twenty's own web hook, so the products' existing discount
// handlers read it unchanged.
export const buildDeliveryPayload = ({
  targetUrl,
  action,
  workspaceId,
  objectMetadataId,
  record,
  updatedFields,
}: {
  targetUrl: string;
  action: DiscountSyncAction;
  workspaceId: string | null;
  objectMetadataId: string | null;
  record: Record<string, unknown>;
  updatedFields?: string[];
}): Record<string, unknown> => ({
  targetUrl,
  eventName: toDiscountEventName(action),
  workspaceId,
  webhookId: 'customer-support-discounts',
  eventDate: new Date().toISOString(),
  objectMetadata: { id: objectMetadataId, nameSingular: 'discount' },
  record,
  ...(updatedFields === undefined || updatedFields.length === 0
    ? {}
    : { updatedFields }),
});

// Twenty's web hook signature: hex HMAC-SHA256 of `${timestamp}:${body}`.
export const signDeliveryBody = ({
  secret,
  timestamp,
  body,
}: {
  secret: string;
  timestamp: string;
  body: string;
}): string =>
  createHmac('sha256', secret).update(`${timestamp}:${body}`).digest('hex');

export const isValidDeliverySignature = ({
  secret,
  timestamp,
  body,
  signature,
}: {
  secret: string;
  timestamp: string | undefined;
  body: string;
  signature: string | undefined;
}): boolean => {
  if (
    secret.length === 0 ||
    timestamp === undefined ||
    signature === undefined
  ) {
    return false;
  }

  const expected = Buffer.from(
    signDeliveryBody({ secret, timestamp, body }),
    'utf8',
  );
  const received = Buffer.from(signature, 'utf8');

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
};

export type DeliveryOutcome = {
  result: DiscountSyncResult;
  httpStatus: number | null;
  errors: AppErrorItem[];
  externalId: string | null;
  response: unknown;
  isRetryable: boolean;
};

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const readAppErrors = (body: unknown): AppErrorItem[] => {
  const container = (body ?? {}) as Record<string, unknown>;

  if (Array.isArray(container.errors)) {
    return container.errors
      .map((item): AppErrorItem | null => {
        if (typeof item === 'string') {
          return { field: null, code: null, message: item };
        }

        const entry = (item ?? {}) as Record<string, unknown>;
        const message =
          readString(entry.message) ?? readString(entry.code) ?? null;

        return message === null
          ? null
          : {
              field: readString(entry.field),
              code: readString(entry.code),
              message,
            };
      })
      .filter((item): item is AppErrorItem => item !== null);
  }

  const message =
    readString(container.message) ??
    readString(container.error) ??
    (typeof body === 'string' ? readString(body) : null);

  return message === null ? [] : [{ field: null, code: null, message }];
};

// 401/403/404 mean a wrong secret or URL: retrying cannot fix them. 408, 429
// and 5xx are the app being busy or down, which a later attempt can outlive.
const isRetryableStatus = (status: number): boolean =>
  status === 408 || status === 429 || status >= 500;

const isConfigurationStatus = (status: number): boolean =>
  status === 401 || status === 403 || status === 404 || status === 405;

export const interpretAppResponse = (
  status: number,
  body: unknown,
): DeliveryOutcome => {
  const container = (body ?? {}) as Record<string, unknown>;
  const declaredStatus = readString(container.status)?.toLowerCase() ?? null;
  const errors = readAppErrors(body);

  if (status >= 200 && status < 300) {
    if (declaredStatus === 'rejected') {
      return {
        result: 'REJECTED',
        httpStatus: status,
        errors,
        externalId: null,
        response: body,
        isRetryable: false,
      };
    }

    if (status === 202 || declaredStatus === 'accepted') {
      return {
        result: 'ACCEPTED',
        httpStatus: status,
        errors: [],
        externalId: null,
        response: body,
        isRetryable: false,
      };
    }

    return {
      result: 'APPLIED',
      httpStatus: status,
      errors: [],
      externalId: readString(container.externalId),
      response: body,
      isRetryable: false,
    };
  }

  if (isRetryableStatus(status) || isConfigurationStatus(status)) {
    return {
      result: 'ERROR',
      httpStatus: status,
      errors:
        errors.length > 0
          ? errors
          : [{ field: null, code: `http_${status}`, message: `HTTP ${status}` }],
      externalId: null,
      response: body,
      isRetryable: isRetryableStatus(status),
    };
  }

  return {
    result: 'REJECTED',
    httpStatus: status,
    errors:
      errors.length > 0
        ? errors
        : [{ field: null, code: `http_${status}`, message: `HTTP ${status}` }],
    externalId: null,
    response: body,
    isRetryable: false,
  };
};

const parseBody = (text: string): unknown => {
  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text.slice(0, 2_000);
  }
};

export type SentDelivery = DeliveryOutcome & {
  deliveryId: string;
  durationMs: number;
};

export const sendDelivery = async ({
  endpoint,
  secret,
  payload,
}: {
  endpoint: string;
  secret: string;
  payload: Record<string, unknown>;
}): Promise<SentDelivery> => {
  const deliveryId = randomBytes(16).toString('hex');
  const body = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DISCOUNT_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Twenty-Webhook-Timestamp': timestamp,
        'X-Twenty-Webhook-Signature': signDeliveryBody({
          secret,
          timestamp,
          body,
        }),
        'X-Twenty-Webhook-Nonce': randomBytes(16).toString('hex'),
        'X-Crm-Delivery-Id': deliveryId,
        'X-Crm-Expect-Result': '1',
      },
      body,
      signal: controller.signal,
    });
    const responseBody = parseBody(await response.text());

    return {
      ...interpretAppResponse(response.status, responseBody),
      deliveryId,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const isTimeout = controller.signal.aborted;

    return {
      result: isTimeout ? 'TIMEOUT' : 'ERROR',
      httpStatus: null,
      errors: [
        {
          field: null,
          code: isTimeout ? 'timeout' : 'network',
          message: isTimeout
            ? `No answer within ${DISCOUNT_REQUEST_TIMEOUT_MS / 1000}s`
            : error instanceof Error
              ? error.message
              : 'Network error',
        },
      ],
      externalId: null,
      response: null,
      isRetryable: true,
      deliveryId,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
};

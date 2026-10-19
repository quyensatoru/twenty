import {
  type CrispConversationPayload,
  type CrispMessagePayload,
} from '../../types/crisp-api';
import { type CrispSettings } from './read-crisp-settings.util';

const CRISP_API_BASE_URL = 'https://api.crisp.chat/v1';
export const CRISP_CONVERSATIONS_PER_PAGE = 50;
// Crisp limits each route per token; a burst of thread reads during a
// backfill trips it. Requests are spaced out, and a 429 waits as long as Crisp
// asks (Retry-After) or these defaults before giving up on the call.
const MIN_REQUEST_SPACING_MS = 300;
const RATE_LIMIT_WAITS_MS = [5_000, 15_000, 30_000];
const MAX_RETRY_AFTER_MS = 60_000;

let lastRequestAt = 0;

type CrispEnvelope<TData> = {
  error?: boolean;
  reason?: string;
  data?: TData;
};

export class CrispApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForRequestSlot = async (): Promise<void> => {
  const waitMs = lastRequestAt + MIN_REQUEST_SPACING_MS - Date.now();

  if (waitMs > 0) {
    await delay(waitMs);
  }

  lastRequestAt = Date.now();
};

const readRetryAfterMs = (response: Response): number | undefined => {
  const seconds = Number(response.headers.get('retry-after'));

  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(seconds * 1000, MAX_RETRY_AFTER_MS)
    : undefined;
};

export const isCrispRateLimitError = (error: unknown): boolean =>
  error instanceof CrispApiError &&
  (error.status === 429 || error.status === 420);

const crispRequest = async <TData>(
  settings: CrispSettings,
  path: string,
  {
    method = 'GET',
    query = {},
    body,
  }: {
    method?: 'GET' | 'PATCH';
    query?: Record<string, string | number | undefined>;
    body?: unknown;
  } = {},
): Promise<TData | undefined> => {
  const url = new URL(`${CRISP_API_BASE_URL}${path}`);

  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(name, String(value));
    }
  }

  const authorization = `Basic ${Buffer.from(
    `${settings.identifier}:${settings.key}`,
  ).toString('base64')}`;

  for (let attempt = 0; ; attempt += 1) {
    await waitForRequestSlot();

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
        'X-Crisp-Tier': 'plugin',
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (
      (response.status === 429 || response.status === 420) &&
      attempt < RATE_LIMIT_WAITS_MS.length
    ) {
      await delay(readRetryAfterMs(response) ?? RATE_LIMIT_WAITS_MS[attempt]);
      continue;
    }

    // A conversation removed in Crisp between the event and this read.
    if (response.status === 404) {
      return undefined;
    }

    const envelope = (await response
      .json()
      .catch(() => ({}))) as CrispEnvelope<TData>;

    if (!response.ok || envelope.error === true) {
      throw new CrispApiError(
        `Crisp ${path.split('/').slice(0, 4).join('/')} answered HTTP ${response.status}: ${envelope.reason ?? response.statusText}`,
        response.status,
      );
    }

    return envelope.data;
  }
};

export const getCrispConversation = (
  settings: CrispSettings,
  websiteId: string,
  sessionId: string,
): Promise<CrispConversationPayload | undefined> =>
  crispRequest<CrispConversationPayload>(
    settings,
    `/website/${websiteId}/conversation/${sessionId}`,
  );

export const listCrispConversations = async (
  settings: CrispSettings,
  websiteId: string,
  {
    pageNumber,
    updatedSince,
  }: {
    pageNumber: number;
    updatedSince?: string;
  },
): Promise<CrispConversationPayload[]> =>
  (await crispRequest<CrispConversationPayload[]>(
    settings,
    `/website/${websiteId}/conversations/${pageNumber}`,
    {
      query: {
        per_page: CRISP_CONVERSATIONS_PER_PAGE,
        filter_date_start: updatedSince,
        filter_date_end:
          updatedSince === undefined ? undefined : new Date().toISOString(),
      },
    },
  )) ?? [];

// Crisp's full-text search over every conversation of the website, however
// old: it reads the visitor's profile as well as the messages, so callers
// check that a result really is the chat they were after.
export const searchCrispConversations = async (
  settings: CrispSettings,
  websiteId: string,
  { pageNumber, text }: { pageNumber: number; text: string },
): Promise<CrispConversationPayload[]> =>
  (await crispRequest<CrispConversationPayload[]>(
    settings,
    `/website/${websiteId}/conversations/${pageNumber}`,
    {
      query: {
        per_page: CRISP_CONVERSATIONS_PER_PAGE,
        search_query: text,
        search_type: 'text',
      },
    },
  )) ?? [];

// Crisp answers with the latest batch before `timestampBefore`, oldest first.
export const listCrispMessages = async (
  settings: CrispSettings,
  websiteId: string,
  sessionId: string,
  timestampBefore?: number,
): Promise<CrispMessagePayload[]> =>
  (await crispRequest<CrispMessagePayload[]>(
    settings,
    `/website/${websiteId}/conversation/${sessionId}/messages`,
    { query: { timestamp_before: timestampBefore } },
  )) ?? [];

// Crisp does not document whether `data` is merged or replaced, so callers
// send the session's whole data with their keys changed, never a subset.
export const updateCrispConversationData = async (
  settings: CrispSettings,
  websiteId: string,
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> => {
  await crispRequest(
    settings,
    `/website/${websiteId}/conversation/${sessionId}/meta`,
    { method: 'PATCH', body: { data } },
  );
};

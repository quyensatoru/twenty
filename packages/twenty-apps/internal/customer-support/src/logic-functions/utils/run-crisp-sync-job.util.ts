import { enqueueJobs } from 'twenty-sdk/logic-function';


import { CRISP_SYNC_LOGIC_FUNCTION_UID } from '../../constants/universal-identifiers';
import { createAppClient } from './create-app-client.util';
import {
  claimCrispWebsites,
  readCrispSyncState,
  writeCrispSyncState,
} from './crisp-sync-state.util';
import { readErrorMessage } from './read-error-message.util';
import {
  isCrispApiConfigured,
  readCrispSettings,
} from './read-crisp-settings.util';
import {
  type CrispSyncCursor,
  type CrispSyncSummary,
  runCrispSync,
} from './run-crisp-sync.util';

export type CrispSyncJobPayload = {
  updatedSince: string;
  runStartedAt: string;
  cursor?: CrispSyncCursor;
  // Consecutive resumes that hit the rate limit again; each one doubles the
  // wait, so an exhausted daily quota is not hammered every few minutes.
  rateLimitStreak?: number;
};

// Leaves room under the 600s function timeout for the last page in flight
// and the continuation enqueue.
const RUN_BUDGET_MS = 420_000;
// Overlaps the previous run so a conversation updated while it was running is
// read again rather than missed.
const CATCH_UP_OVERLAP_MS = 15 * 60 * 1000;
const FIRST_RUN_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
// Crisp's route limits reset within minutes; resuming sooner only hits the
// limit again.
const RATE_LIMIT_RESUME_DELAY_MS = 2 * 60 * 1000;
const MAX_RATE_LIMIT_RESUME_DELAY_MS = 60 * 60 * 1000;

export const buildCatchUpPayload = async (): Promise<CrispSyncJobPayload> => {
  const { lastSyncedAt } = await readCrispSyncState();
  const now = Date.now();
  const since =
    lastSyncedAt === null
      ? now - FIRST_RUN_WINDOW_MS
      : new Date(lastSyncedAt).getTime() - CATCH_UP_OVERLAP_MS;

  return {
    updatedSince: new Date(since).toISOString(),
    runStartedAt: new Date(now).toISOString(),
  };
};

export const enqueueCrispSync = async (
  payload: CrispSyncJobPayload,
  delayMs?: number,
): Promise<boolean> => {
  const result = await enqueueJobs({
    logicFunctionUniversalIdentifier: CRISP_SYNC_LOGIC_FUNCTION_UID,
    payloads: [payload],
    retryLimit: 2,
    ...(delayMs === undefined ? {} : { delayMs }),
  });

  return result.enqueued;
};

export const runCrispSyncJob = async (
  payload: CrispSyncJobPayload,
): Promise<CrispSyncSummary | { skipped: string }> => {
  const settings = readCrispSettings();

  if (!settings.enabled) {
    return { skipped: 'Crisp sync is turned off' };
  }

  if (!isCrispApiConfigured(settings)) {
    return { skipped: 'Crisp plugin token or website ids are not set' };
  }

  const claimErrors = await claimCrispWebsites(settings);

  try {
    const summary = await runCrispSync({
      client: createAppClient(),
      settings,
      updatedSince: payload.updatedSince,
      cursor: payload.cursor ?? { websiteIndex: 0, pageNumber: 1 },
      deadline: Date.now() + RUN_BUDGET_MS,
    });

    if (!summary.completed && summary.next !== undefined) {
      const isRateLimited = summary.isRateLimited === true;
      // A rate-limited run that still imported something made progress, so
      // the backoff starts over.
      const madeProgress =
        summary.conversations > 0 || summary.threadsImported > 0;
      const rateLimitStreak = isRateLimited
        ? madeProgress
          ? 0
          : (payload.rateLimitStreak ?? 0) + 1
        : 0;
      const delayMs = isRateLimited
        ? Math.min(
            RATE_LIMIT_RESUME_DELAY_MS * 2 ** rateLimitStreak,
            MAX_RATE_LIMIT_RESUME_DELAY_MS,
          )
        : undefined;

      if (delayMs !== undefined) {
        await writeCrispSyncState({
          lastError: `Crisp is rate limiting the plugin token (its daily quota may be used up); the sync retries in ${Math.round(delayMs / 60_000)} min. Live messages from the web hook keep arriving.`,
        });
      }

      await enqueueCrispSync(
        { ...payload, cursor: summary.next, rateLimitStreak },
        delayMs,
      );

      return summary;
    }

    const { lastSyncedAt } = await readCrispSyncState();
    const isNewer =
      lastSyncedAt === null ||
      new Date(payload.runStartedAt).getTime() >
        new Date(lastSyncedAt).getTime();

    await writeCrispSyncState({
      ...(isNewer ? { lastSyncedAt: payload.runStartedAt } : {}),
      lastError: claimErrors.length > 0 ? claimErrors.join('; ') : null,
    });

    return summary;
  } catch (error) {
    await writeCrispSyncState({ lastError: readErrorMessage(error) });

    throw error;
  }
};

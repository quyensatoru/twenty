import { enqueueJobs, kv } from 'twenty-sdk/logic-function';

import {
  CRISP_PLAN_DATA_DAILY_BUDGET_VARIABLE,
  CRISP_PLAN_DATA_SWEEP_STATE_KEY,
} from '../../constants/crisp';
import { CRISP_PLAN_DATA_SWEEP_LOGIC_FUNCTION_UID } from '../../constants/universal-identifiers';
import { type ApiClient } from '../../types/api-client';
import { createAppClient } from './create-app-client.util';
import {
  CRISP_CONVERSATIONS_PER_PAGE,
  isCrispRateLimitError,
  listCrispConversations,
} from './crisp-api.util';
import {
  type CrispSettings,
  type CrispWebsite,
  canWritePlanData,
  readCrispSettings,
} from './read-crisp-settings.util';
import { writePlanDataToChats } from './sync-conversation-plan-data.util';

// Walks every chat in Crisp a page at a time: the safety net for whatever the
// merchant and new-chat triggers missed, and the first fill at go-live. Crisp's daily quota is shared with the chat sync, so the walk spends
// at most a daily budget and picks up where it stopped the next day.
type SweepState = {
  cycleStartedAt: string | null;
  websiteIndex: number;
  pageNumber: number;
  budgetDay: string | null;
  requestsUsed: number;
};

export type PlanDataSweepSummary = {
  pages: number;
  updated: number;
  requestsUsed: number;
  stoppedBecause: 'cycle-done' | 'daily-budget' | 'run-time' | 'rate-limit';
};

const EMPTY_STATE: SweepState = {
  cycleStartedAt: null,
  websiteIndex: 0,
  pageNumber: 1,
  budgetDay: null,
  requestsUsed: 0,
};
const DEFAULT_DAILY_BUDGET = 5000;
const RUN_BUDGET_MS = 420_000;
const RATE_LIMIT_RESUME_DELAY_MS = 10 * 60 * 1000;

const readDailyBudget = (): number => {
  const budget = Number(process.env[CRISP_PLAN_DATA_DAILY_BUDGET_VARIABLE]);

  return Number.isFinite(budget) && budget > 0 ? budget : DEFAULT_DAILY_BUDGET;
};

const readSweepState = async (): Promise<SweepState> => ({
  ...EMPTY_STATE,
  ...((await kv.get<Partial<SweepState>>(CRISP_PLAN_DATA_SWEEP_STATE_KEY)) ??
    {}),
});

const enqueueSweep = async (delayMs?: number): Promise<void> => {
  await enqueueJobs({
    logicFunctionUniversalIdentifier: CRISP_PLAN_DATA_SWEEP_LOGIC_FUNCTION_UID,
    payloads: [{}],
    retryLimit: 1,
    ...(delayMs === undefined ? {} : { delayMs }),
  });
};

const sweepPage = async ({
  client,
  settings,
  website,
  state,
}: {
  client: ApiClient;
  settings: CrispSettings;
  website: CrispWebsite;
  state: SweepState;
}): Promise<{ conversationCount: number; updated: number }> => {
  const conversations = await listCrispConversations(
    settings,
    website.websiteId,
    { pageNumber: state.pageNumber },
  );

  state.requestsUsed += 1;

  const changes = await writePlanDataToChats({
    client,
    settings,
    chats: conversations.map((conversation) => ({ website, conversation })),
  });

  state.requestsUsed += changes.length;

  return { conversationCount: conversations.length, updated: changes.length };
};

export const runPlanDataSweep = async ({
  startCycle,
}: {
  startCycle: boolean;
}): Promise<PlanDataSweepSummary | { skipped: string }> => {
  const settings = readCrispSettings();

  if (!canWritePlanData(settings)) {
    return { skipped: 'Crisp plan data is off or Crisp is not configured' };
  }

  const client = createAppClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dailyBudget = readDailyBudget();
  const deadline = Date.now() + RUN_BUDGET_MS;
  const state = await readSweepState();
  let pages = 0;
  let updated = 0;

  if (state.budgetDay !== today) {
    state.budgetDay = today;
    state.requestsUsed = 0;
  }

  if (state.cycleStartedAt === null) {
    if (!startCycle) {
      return { skipped: 'No sweep in progress' };
    }

    Object.assign(state, {
      cycleStartedAt: now.toISOString(),
      websiteIndex: 0,
      pageNumber: 1,
    });
  }

  const finish = async (
    stoppedBecause: PlanDataSweepSummary['stoppedBecause'],
  ): Promise<PlanDataSweepSummary> => {
    await kv.set(CRISP_PLAN_DATA_SWEEP_STATE_KEY, state);

    return { pages, updated, requestsUsed: state.requestsUsed, stoppedBecause };
  };

  for (;;) {
    const website = settings.websites[state.websiteIndex];

    if (website === undefined) {
      state.cycleStartedAt = null;

      return finish('cycle-done');
    }

    // A full page can need one read plus a write per chat.
    if (state.requestsUsed + CRISP_CONVERSATIONS_PER_PAGE + 1 > dailyBudget) {
      return finish('daily-budget');
    }

    if (Date.now() > deadline) {
      await enqueueSweep();

      return finish('run-time');
    }

    try {
      const page = await sweepPage({ client, settings, website, state });

      pages += 1;
      updated += page.updated;

      if (page.conversationCount < CRISP_CONVERSATIONS_PER_PAGE) {
        state.websiteIndex += 1;
        state.pageNumber = 1;
      } else {
        state.pageNumber += 1;
      }

      await kv.set(CRISP_PLAN_DATA_SWEEP_STATE_KEY, state);
    } catch (error) {
      if (!isCrispRateLimitError(error)) {
        await kv.set(CRISP_PLAN_DATA_SWEEP_STATE_KEY, state);

        throw error;
      }

      // The page is read again on resume; the chats already updated on it
      // match and cost nothing.
      await enqueueSweep(RATE_LIMIT_RESUME_DELAY_MS);

      return finish('rate-limit');
    }
  }
};

import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CAMPAIGN_STATS_ROUTE_PATH } from '../constants/route-paths';
import { CAMPAIGN_STATS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type EmailSendStatus } from '../types/email-send-status';
import { executeWithRetry } from '../utils/execute-with-retry.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';

const STATUSES: EmailSendStatus[] = ['SENT', 'FAILED', 'SKIPPED'];
const RECENT_FAILURES_LIMIT = 8;

type FailedSendNode = {
  name?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
};

// Counted with the application token: sends hang off merchants, which are
// app-scoped, so the member's own token would only count the apps they hold
// a grant on and the totals would not match what was sent.
const handler = async (event: RoutePayload<{ campaignId?: string }>) => {
  try {
    const campaignId = event.body?.campaignId;

    if (!campaignId) {
      return { success: false, error: 'campaignId is required.' };
    }

    const client = createAppClient();
    const [entries, failures] = await Promise.all([
      Promise.all(
        STATUSES.map(async (status) => {
          const { emailSends } = await executeWithRetry<{
            emailSends?: { totalCount?: number };
          }>(() =>
            client.query({
              emailSends: {
                __args: {
                  filter: {
                    campaignId: { eq: campaignId },
                    status: { eq: status },
                  },
                  first: 1,
                },
                totalCount: true,
              },
            }),
          );

          return [status, emailSends?.totalCount ?? 0] as const;
        }),
      ),
      // Newest failures first, so BD sees what to fix without opening the
      // Send log: recipient, provider error and when it happened.
      executeWithRetry<{ emailSends?: { edges?: { node: FailedSendNode }[] } }>(
        () =>
          client.query({
            emailSends: {
              __args: {
                filter: {
                  campaignId: { eq: campaignId },
                  status: { eq: 'FAILED' },
                },
                first: RECENT_FAILURES_LIMIT,
                orderBy: [{ createdAt: 'DescNullsLast' }],
              },
              edges: {
                node: {
                  name: true,
                  errorMessage: true,
                  sentAt: true,
                  createdAt: true,
                },
              },
            },
          }),
      ).then(({ emailSends }) => (emailSends?.edges ?? []).map(({ node }) => ({
        to: node.name ?? '',
        error: node.errorMessage ?? '',
        at: node.sentAt ?? node.createdAt ?? null,
      }))),
    ]);

    return {
      success: true,
      counts: Object.fromEntries(entries),
      recentFailures: failures,
    };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: CAMPAIGN_STATS_LOGIC_FUNCTION_UID,
  name: 'campaign-send-stats',
  description: 'Route: counts sent, failed and skipped emails of a campaign.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CAMPAIGN_STATS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});

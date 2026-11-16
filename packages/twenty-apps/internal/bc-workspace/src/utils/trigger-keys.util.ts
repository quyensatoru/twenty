// Deduplication keys of automatic tasks. One key, one task: a webhook retry
// or a repeated threshold event finds the task the first event created.

export const buildIssueTaskKey = (issueId: string): string => `issue:${issueId}`;

export const buildNoReplyTaskKey = (
  vipClientId: string,
  awaitingReplySince: string,
): string => `no-reply:${vipClientId}:${awaitingReplySince}`;

export const buildNewVipTaskKey = (
  vipClientId: string,
  picId: string,
): string => `new-vip:${vipClientId}:${picId}`;

export const buildDowngradeTaskKey = (subscriptionEventKey: string): string =>
  `downgrade:${subscriptionEventKey}`;

export const buildUninstallTaskKey = (subscriptionEventKey: string): string =>
  `uninstall:${subscriptionEventKey}`;

// One key per real-world plan event, whichever source reports it: the CRM
// merchant sync and the billing ingest land on the same record, a day apart
// at most. Days are UTC so both sources agree.
export const buildSubscriptionEventKey = ({
  vipClientId,
  appName,
  eventType,
  newPlan,
  effectiveAt,
}: {
  vipClientId: string;
  appName: string | null;
  eventType: string;
  newPlan: string | null;
  effectiveAt: string;
}): string =>
  `sub:${vipClientId}:${(appName ?? '-').toUpperCase()}:${eventType}:${(newPlan ?? '-').toUpperCase()}:${new Date(Date.parse(effectiveAt)).toISOString().slice(0, 10)}`;

export const buildPicChangeKey = (vipClientId: string, changedAt: string): string =>
  `pic:${vipClientId}:${changedAt}`;

export const buildIssueReminderKey = (issueId: string, day: string): string =>
  `issue-reminder:${issueId}:${day}`;

export const buildOpportunityKey = ({
  vipClientId,
  appName,
  plan,
  billingCycle,
}: {
  vipClientId: string;
  appName: string;
  plan: string;
  billingCycle: string;
}): string =>
  `usage:${vipClientId}:${appName.toUpperCase()}:${plan.toUpperCase()}:${billingCycle}`;

export const buildUsageTaskKey = (opportunityKey: string): string =>
  `task:${opportunityKey}`;

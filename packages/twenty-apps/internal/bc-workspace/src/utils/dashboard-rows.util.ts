import {
  type BcIssueRecord,
  type BcReviewRecord,
  type MerchantRecord,
  type RelationshipStatus,
  type ReviewState,
  type VipClientRecord,
} from '../types/bc-records';
import {
  type ClientAppChat,
  type ClientAppEntry,
  type ClientListFilters,
  type ClientRow,
  type DashboardKpi,
  type DashboardKpiCounts,
} from '../types/dashboard';
import {
  computeAppHealth,
  computeReviewState,
  type LifecyclePlanInfo,
  readSubscriptionLifecycle,
} from './client-status.util';
import { type SortValue } from './sort-records.util';

export const buildPlanKey = (appName: string, planCode: string): string =>
  `${appName.toUpperCase()}:${planCode.toUpperCase()}`;

export type PlanCatalogEntry = LifecyclePlanInfo & {
  appName: string;
  planCode: string;
  label: string;
  rank: number | null;
};

export type PlanCatalog = Map<string, PlanCatalogEntry>;

export type MerchantConversation = {
  id: string;
  merchantId: string | null;
  lastMessageAt: string | null;
  lastMessageExcerpt: string | null;
  websiteId: string | null;
  sessionId: string | null;
};

const sameApp = (left: string | null, right: string | null): boolean =>
  (left ?? '').toUpperCase() === (right ?? '').toUpperCase();

export const buildCrispInboxUrl = (
  conversation: Pick<MerchantConversation, 'websiteId' | 'sessionId'>,
): string | null =>
  conversation.websiteId === null || conversation.sessionId === null
    ? null
    : `https://app.crisp.chat/website/${conversation.websiteId}/inbox/${conversation.sessionId}/`;

const toAppChat = (conversation: MerchantConversation | undefined): ClientAppChat | null =>
  conversation === undefined
    ? null
    : {
        conversationId: conversation.id,
        crispUrl: buildCrispInboxUrl(conversation),
        preview: conversation.lastMessageExcerpt,
        lastMessageAt: conversation.lastMessageAt,
      };

export const buildClientRow = ({
  vipClient,
  merchants,
  openIssues,
  reviews,
  memberNames,
  planCatalog,
  paidMerchantIds,
  conversationsByMerchant,
}: {
  vipClient: VipClientRecord;
  merchants: MerchantRecord[];
  openIssues: BcIssueRecord[];
  reviews: BcReviewRecord[];
  memberNames: Map<string, string>;
  planCatalog: PlanCatalog;
  paidMerchantIds: Set<string>;
  conversationsByMerchant: Map<string, MerchantConversation>;
}): ClientRow => {
  const apps: ClientAppEntry[] = merchants
    .filter((merchant) => (merchant.app?.name ?? '').length > 0)
    .map((merchant) => {
      const appName = merchant.app?.name as string;
      const plan = merchant.pricingPlan;
      const catalogEntry =
        plan === null ? undefined : planCatalog.get(buildPlanKey(appName, plan));
      const lifecycle = readSubscriptionLifecycle(merchant, {
        plan: catalogEntry ?? null,
        hadPaidPlan: paidMerchantIds.has(merchant.id),
      });
      const lifecycleMerchant = { ...merchant, lifecycle };

      return {
        merchantId: merchant.id,
        appName,
        plan,
        planLabel: plan === null ? null : (catalogEntry?.label ?? plan),
        lifecycle,
        health: computeAppHealth({ merchant: lifecycleMerchant, appName, openIssues }),
        review: computeReviewState({ merchant: lifecycleMerchant, appName, reviews }),
        installedAt: merchant.installedAt,
        usage:
          vipClient.appUsage?.[appName] ??
          vipClient.appUsage?.[appName.toUpperCase()] ??
          null,
        chat: toAppChat(conversationsByMerchant.get(merchant.id)),
      };
    })
    .sort((left, right) => left.appName.localeCompare(right.appName));

  const latestChat = apps
    .map((app) => app.chat)
    .filter((chat): chat is ClientAppChat => chat !== null)
    .sort(
      (left, right) =>
        Date.parse(right.lastMessageAt ?? '') - Date.parse(left.lastMessageAt ?? ''),
    )[0];

  return {
    id: vipClient.id,
    name: vipClient.name ?? vipClient.shopDomain ?? '',
    shopDomain: vipClient.shopDomain,
    status: vipClient.relationshipStatus,
    picId: vipClient.picId,
    picName: vipClient.picId === null ? null : (memberNames.get(vipClient.picId) ?? null),
    teamId: vipClient.teamId,
    lastBcContactAt: vipClient.lastBcContactAt,
    lastBcContactByName:
      vipClient.lastBcContactMemberId === null
        ? null
        : (memberNames.get(vipClient.lastBcContactMemberId) ?? null),
    apps,
    reviewedCount: apps.filter((app) => app.review === 'REVIEWED').length,
    eligibleReviewCount: apps.filter((app) => app.review !== 'NOT_ELIGIBLE').length,
    openIssueCount: openIssues.length,
    crispConversationId: latestChat?.conversationId ?? null,
  };
};

const hasAppCondition = (filters: ClientListFilters): boolean =>
  filters.appName !== null ||
  filters.plan !== null ||
  filters.appHealth !== null ||
  filters.review !== null;

// Plan filter values are "APP:CODE" so a plan of one app never matches the
// same code on another; a bare code still matches on any app.
const matchesPlan = (app: ClientAppEntry, plan: string): boolean =>
  plan.includes(':')
    ? app.plan !== null && buildPlanKey(app.appName, app.plan) === plan.toUpperCase()
    : sameApp(app.plan, plan);

// Product, plan, health and review must all hold on the SAME app: a MIDA
// review never satisfies a FRAUD condition, and a Pro plan on one app plus
// a missing review on another is not a match.
export const matchesAppConditions = (
  row: Pick<ClientRow, 'apps'>,
  filters: Pick<ClientListFilters, 'appName' | 'plan' | 'appHealth' | 'review'>,
): boolean =>
  row.apps.some(
    (app) =>
      (filters.appName === null || sameApp(app.appName, filters.appName)) &&
      (filters.plan === null || matchesPlan(app, filters.plan)) &&
      (filters.appHealth === null || app.health === filters.appHealth) &&
      (filters.review === null || app.review === filters.review),
  );

export const matchesKpi = (status: RelationshipStatus, kpi: DashboardKpi): boolean => {
  switch (kpi) {
    case 'ACTIVE':
      return status === 'ACTIVE';
    case 'NEED_FOLLOW_UP':
      return status === 'FOLLOW_UP' || status === 'WAITING_FOR_CLIENT';
    case 'AT_RISK':
      return status === 'AT_RISK';
    default:
      return true;
  }
};

export const matchesClientFilters = (
  row: ClientRow,
  filters: ClientListFilters,
): boolean => {
  const search = filters.search.trim().toLowerCase();

  if (
    search.length > 0 &&
    !row.name.toLowerCase().includes(search) &&
    !(row.shopDomain ?? '').toLowerCase().includes(search)
  ) {
    return false;
  }

  if (filters.picId !== null) {
    if (filters.picId === 'UNASSIGNED' ? row.picId !== null : row.picId !== filters.picId) {
      return false;
    }
  }

  if (filters.status !== null && row.status !== filters.status) {
    return false;
  }

  if (hasAppCondition(filters) && !matchesAppConditions(row, filters)) {
    return false;
  }

  return matchesKpi(row.status, filters.kpi);
};

export const countKpis = (rows: Pick<ClientRow, 'status'>[]): DashboardKpiCounts => ({
  total: rows.length,
  active: rows.filter((row) => matchesKpi(row.status, 'ACTIVE')).length,
  needFollowUp: rows.filter((row) => matchesKpi(row.status, 'NEED_FOLLOW_UP')).length,
  atRisk: rows.filter((row) => matchesKpi(row.status, 'AT_RISK')).length,
});

// Plan options follow the catalog of the selected app; the plans seen on
// clients fill in for apps the catalog does not cover yet.
export const buildPlanOptions = ({
  rows,
  planCatalog,
  appName,
}: {
  rows: Pick<ClientRow, 'apps'>[];
  planCatalog: PlanCatalog;
  appName: string | null;
}): { value: string; label: string }[] => {
  const options = new Map<string, { value: string; label: string; rank: number }>();
  const addOption = (app: string, planCode: string, label: string, rank: number | null) => {
    if (appName !== null && !sameApp(app, appName)) {
      return;
    }

    const value = buildPlanKey(app, planCode);

    if (!options.has(value)) {
      options.set(value, {
        value,
        label: appName === null ? `${app} · ${label}` : label,
        rank: rank ?? Number.MAX_SAFE_INTEGER,
      });
    }
  };

  for (const entry of planCatalog.values()) {
    addOption(entry.appName, entry.planCode, entry.label, entry.rank);
  }

  for (const row of rows) {
    for (const app of row.apps) {
      if (app.plan !== null) {
        addOption(app.appName, app.plan, app.planLabel ?? app.plan, null);
      }
    }
  }

  return [...options.values()]
    .sort((left, right) => left.rank - right.rank || left.label.localeCompare(right.label))
    .map(({ value, label }) => ({ value, label }));
};

const STATUS_ORDER: Record<RelationshipStatus, number> = {
  AT_RISK: 0,
  FOLLOW_UP: 1,
  WAITING_FOR_CLIENT: 2,
  ACTIVE: 3,
  INACTIVE: 4,
};

const REVIEW_ORDER: Record<ReviewState, number> = {
  REVIEWED: 2,
  NEEDS_REVIEW: 1,
  NOT_ELIGIBLE: 0,
};

// Multi-app rows sort on the filtered app, else on their first app by name,
// so the order is the same on every load.
const pickSortApp = (row: ClientRow, appName: string | null): ClientAppEntry | undefined =>
  (appName === null ? undefined : row.apps.find((app) => sameApp(app.appName, appName))) ??
  row.apps[0];

export const readClientSortValue = (
  row: ClientRow,
  key: string,
  appName: string | null,
): SortValue => {
  switch (key) {
    case 'client':
      return row.name;
    case 'product':
      return pickSortApp(row, appName)?.appName ?? null;
    case 'plan':
      return pickSortApp(row, appName)?.planLabel ?? null;
    case 'pic':
      return row.picName;
    case 'lastBcContact':
      return row.lastBcContactAt;
    case 'status':
      return STATUS_ORDER[row.status];
    case 'review': {
      if (appName !== null) {
        const app = row.apps.find((candidate) => sameApp(candidate.appName, appName));

        return app === undefined ? null : REVIEW_ORDER[app.review];
      }

      return row.eligibleReviewCount === 0
        ? null
        : row.reviewedCount / row.eligibleReviewCount;
    }
    default:
      return null;
  }
};

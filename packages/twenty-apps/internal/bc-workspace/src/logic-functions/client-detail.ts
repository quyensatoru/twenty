import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CLIENT_DETAIL_ROUTE_PATH } from '../constants/route-paths';
import { CLIENT_DETAIL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type BcActivityRecord,
  type BcIssueRecord,
  type BcPaymentRecord,
  type BcTaskRecord,
} from '../types/bc-records';
import {
  type ClientDetailResult,
  type ClientIssueItem,
} from '../types/dashboard';
import { buildClientRow } from '../utils/dashboard-rows.util';
import {
  listByVipClientIds,
  listClientMerchants,
  loadScopedVipClient,
} from './utils/client-store.util';
import {
  canEditClient,
  listClientReviews,
  loadLatestConversationByMerchant,
  loadPaidMerchantIds,
  loadPlanCatalog,
} from './utils/dashboard-data.util';
import { listAllRecords } from './utils/list-all-records.util';
import { readBcSettings } from './utils/read-bc-settings.util';
import {
  BC_ACTIVITY_SELECTION,
  BC_ISSUE_SELECTION,
  BC_PAYMENT_SELECTION,
  BC_TASK_SELECTION,
} from './utils/record-selections';
import { requireString } from './utils/require-string.util';
import { runBcRoute } from './utils/run-bc-route.util';
import {
  indexMemberNames,
  listWorkspaceMembers,
} from './utils/workspace-members.util';

const TIMELINE_LIMIT = 100;
const CLOSED_ISSUE_LIMIT = 10;

const toIssueItem = (
  issue: BcIssueRecord,
  memberNames: Map<string, string>,
): ClientIssueItem => ({
  id: issue.id,
  title: issue.title ?? '',
  summary: issue.summary,
  classification: issue.classification,
  status: issue.status,
  source: issue.source,
  appNames: issue.appNames ?? [],
  detectedAt: issue.detectedAt,
  resolvedAt: issue.resolvedAt,
  resolvedByName:
    issue.resolvedByMemberId === null
      ? null
      : (memberNames.get(issue.resolvedByMemberId) ?? null),
  dismissReason: issue.dismissReason,
  confidence: issue.confidence,
  evidence: Array.isArray(issue.evidence) ? issue.evidence.slice(-5).reverse() : [],
});

const handler = async (event: RoutePayload<{ vipClientId?: string }>) =>
  runBcRoute(async ({ client, scope }) => {
    const vipClient = await loadScopedVipClient({
      client,
      scope,
      vipClientId: requireString(event.body?.vipClientId, 'vipClientId'),
    });
    const ids = [vipClient.id];

    const [merchants, issues, tasks, activities, reviews, members, planCatalog] =
      await Promise.all([
        listClientMerchants(client, ids),
        listByVipClientIds<BcIssueRecord>({
          client,
          pluralName: 'bcIssues',
          vipClientIds: ids,
          selection: BC_ISSUE_SELECTION,
          orderBy: [{ detectedAt: 'DescNullsLast' }],
        }),
        listByVipClientIds<BcTaskRecord>({
          client,
          pluralName: 'bcTasks',
          vipClientIds: ids,
          selection: BC_TASK_SELECTION,
          extraFilter: { status: { in: ['TODO', 'IN_PROGRESS'] } },
          orderBy: [{ createdAt: 'DescNullsLast' }],
        }),
        listAllRecords<BcActivityRecord>({
          client,
          pluralName: 'bcActivities',
          filter: { vipClientId: { eq: vipClient.id } },
          selection: BC_ACTIVITY_SELECTION,
          orderBy: [{ occurredAt: 'DescNullsLast' }],
          maxRecords: TIMELINE_LIMIT,
        }),
        listClientReviews(client, ids),
        listWorkspaceMembers(client),
        loadPlanCatalog(client),
      ]);
    const merchantIds = merchants.map((merchant) => merchant.id);
    const [conversationsByMerchant, paidMerchantIds, developerTaskActivities] =
      await Promise.all([
        loadLatestConversationByMerchant(client, merchantIds),
        loadPaidMerchantIds(client, merchantIds, planCatalog),
        // Developer tasks stay on the client however long the timeline grows.
        listAllRecords<BcActivityRecord>({
          client,
          pluralName: 'bcActivities',
          filter: {
            vipClientId: { eq: vipClient.id },
            activityType: { eq: 'DEVELOPER_TASK' },
          },
          selection: BC_ACTIVITY_SELECTION,
          orderBy: [{ occurredAt: 'DescNullsLast' }],
          maxRecords: 50,
        }),
      ]);
    const memberNames = indexMemberNames(members);
    const openIssues = issues.filter((issue) => issue.status === 'OPEN');
    const row = buildClientRow({
      vipClient,
      merchants,
      openIssues,
      reviews,
      memberNames,
      planCatalog,
      paidMerchantIds,
      conversationsByMerchant,
    });

    const result: ClientDetailResult = {
      client: { ...row, notes: vipClient.notes, assignedAt: vipClient.assignedAt },
      developerTasks: developerTaskActivities.flatMap((activity) =>
        activity.developerIssueId === null
          ? []
          : [
              {
                issueId: activity.developerIssueId,
                title: activity.title ?? '',
                appName: activity.appName,
                createdAt: activity.occurredAt ?? activity.createdAt,
                createdByName:
                  activity.actorMemberId === null
                    ? null
                    : (memberNames.get(activity.actorMemberId) ?? null),
              },
            ],
      ),
      openIssues: openIssues.map((issue) => toIssueItem(issue, memberNames)),
      closedIssues: issues
        .filter((issue) => issue.status !== 'OPEN')
        .slice(0, CLOSED_ISSUE_LIMIT)
        .map((issue) => toIssueItem(issue, memberNames)),
      openTasks: tasks.map((task) => ({
        id: task.id,
        title: task.title ?? '',
        category: task.category,
        customCategory: task.customCategory,
        status: task.status,
        priority: task.priority,
        source: task.source,
        ownerName: task.ownerId === null ? null : (memberNames.get(task.ownerId) ?? null),
        createdAt: task.createdAt,
      })),
      activities: activities.map((activity) => ({
        id: activity.id,
        type: activity.activityType,
        title: activity.title ?? '',
        summary: activity.summary,
        direction: activity.direction,
        topic: activity.topic,
        meetingStatus: activity.meetingStatus,
        isBcAuthored: activity.isBcAuthored,
        actorName:
          activity.actorMemberId === null
            ? null
            : (memberNames.get(activity.actorMemberId) ?? null),
        occurredAt: activity.occurredAt ?? activity.createdAt,
        appName: activity.appName,
        sourceUrl: activity.sourceUrl,
        developerIssueId: activity.developerIssueId,
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        appName: review.appName,
        reviewerName: review.name,
        rating: review.rating,
        publishedAt: review.publishedAt,
        reviewUrl: review.reviewUrl,
        isVerified: review.isVerified,
        creditedName:
          review.creditedMemberId === null
            ? null
            : (memberNames.get(review.creditedMemberId) ?? null),
      })),
      canEdit: canEditClient(scope, vipClient),
    };

    // Financial figures are computed and returned only for managers; a BC's
    // payload carries no trace of them.
    if (scope.canSeeFinance) {
      const currency = readBcSettings().baseCurrency;
      const [anyPayment, payments] = await Promise.all([
        listAllRecords<{ id: string }>({
          client,
          pluralName: 'bcPayments',
          selection: { id: true },
          maxRecords: 1,
        }),
        listAllRecords<BcPaymentRecord>({
          client,
          pluralName: 'bcPayments',
          filter: { vipClientId: { eq: vipClient.id } },
          selection: BC_PAYMENT_SELECTION,
        }),
      ]);

      result.lifetimeRevenue =
        anyPayment.length === 0
          ? { status: 'UNAVAILABLE', amount: null, currency }
          : {
              status: 'AVAILABLE',
              amount: payments.reduce(
                (total, payment) =>
                  total + (payment.kind === 'REFUND' ? -1 : 1) * Math.abs(payment.amount ?? 0),
                0,
              ),
              currency,
            };
    }

    return result;
  });

export default defineLogicFunction({
  universalIdentifier: CLIENT_DETAIL_LOGIC_FUNCTION_UID,
  name: 'bc-client-detail',
  description:
    'Route: one VIP client with its apps, issues, open tasks, timeline and reviews; lifetime revenue for managers only.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: CLIENT_DETAIL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});

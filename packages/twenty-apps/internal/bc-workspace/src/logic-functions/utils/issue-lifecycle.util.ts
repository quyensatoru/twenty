import { type ApiClient } from '../../types/api-client';
import {
  type BcIssueRecord,
  type BcTaskRecord,
  type IssueEvidence,
  type IssueSource,
  type VipClientRecord,
} from '../../types/bc-records';
import { appendHistory } from '../../utils/history.util';
import { buildIssueTaskKey } from '../../utils/trigger-keys.util';
import { recordActivity } from './activity-store.util';
import { readTaskByTriggerKey, upsertAutoTask } from './auto-task.util';
import { readVipClient } from './client-store.util';
import { listAllRecords } from './list-all-records.util';
import { recomputeClientStatus } from './recompute-client-status.util';
import { BC_ISSUE_SELECTION, BC_TASK_SELECTION } from './record-selections';
import { createRecord, updateRecord } from './record-store.util';

const MAX_EVIDENCE = 50;

export const openClientIssue = async ({
  client,
  vipClient,
  title,
  summary,
  classification,
  appNames,
  source,
  confidence = null,
  evidence = [],
  actorMemberId = null,
  detectedAt = new Date().toISOString(),
}: {
  client: ApiClient;
  vipClient: VipClientRecord;
  title: string;
  summary: string | null;
  classification: string | null;
  appNames: string[];
  source: IssueSource;
  confidence?: number | null;
  evidence?: IssueEvidence[];
  actorMemberId?: string | null;
  detectedAt?: string;
}): Promise<{ issue: BcIssueRecord; task: BcTaskRecord }> => {
  const issue = await createRecord<BcIssueRecord>({
    client,
    objectNameSingular: 'bcIssue',
    data: {
      title: title.slice(0, 250),
      summary,
      classification,
      status: 'OPEN',
      source,
      appNames,
      detectedAt,
      lastEvidenceAt: detectedAt,
      confidence,
      evidence: evidence.slice(-MAX_EVIDENCE),
      vipClientId: vipClient.id,
      history: appendHistory(null, {
        actorMemberId,
        action: 'OPENED',
        to: 'OPEN',
        note: source,
      }),
    },
    selection: BC_ISSUE_SELECTION,
  });

  const task = await ensureIssueFollowUps({ client, issue, vipClient, actorMemberId });

  return { issue, task };
};

// Everything that must follow an open issue, each step keyed so a retry after
// a partial failure finishes the job instead of stopping at the issue.
export const ensureIssueFollowUps = async ({
  client,
  issue,
  vipClient,
  actorMemberId = null,
}: {
  client: ApiClient;
  issue: BcIssueRecord;
  vipClient: VipClientRecord;
  actorMemberId?: string | null;
}): Promise<BcTaskRecord> => {
  const appNames = issue.appNames ?? [];
  const detectedAt = issue.detectedAt ?? issue.createdAt;
  const { task } = await upsertAutoTask(client, {
    triggerKey: buildIssueTaskKey(issue.id),
    triggerType: 'ISSUE',
    vipClientId: vipClient.id,
    ownerId: vipClient.picId,
    title: `Follow up on issue: ${issue.title ?? ''}`,
    notes: issue.summary,
    category: 'CLIENT_ISSUE',
    priority: 'HIGH',
    appName: appNames[0] ?? null,
    issueId: issue.id,
  });
  const firstEvidence = Array.isArray(issue.evidence) ? issue.evidence[0] : undefined;

  await recordActivity(client, {
    vipClientId: vipClient.id,
    type: 'ISSUE_DETECTED',
    title: `${issue.source === 'AI' ? 'AI detected issue' : 'Issue logged'}: ${issue.title ?? ''}`,
    summary: issue.summary,
    direction: 'INTERNAL',
    topic: 'ISSUE',
    actorMemberId,
    occurredAt: detectedAt,
    appName: appNames[0] ?? null,
    sourceUrl: firstEvidence?.url ?? null,
    externalId: `issue-detected:${issue.id}`,
    metadata: { issueId: issue.id, appNames },
  });

  if (issue.status === 'OPEN') {
    await recomputeClientStatus({ client, vipClientId: vipClient.id, actorMemberId });
  }

  return task;
};

// A repeat message about an open issue adds evidence to it and brings its
// follow-up task back in front of the BC; it never opens a second issue or
// task. A task the BC already closed reopens while the issue is still open.
export const appendIssueEvidence = async ({
  client,
  issue,
  evidence,
  appNames = [],
}: {
  client: ApiClient;
  issue: BcIssueRecord;
  evidence: IssueEvidence;
  appNames?: string[];
}): Promise<BcIssueRecord> => {
  const existingEvidence = Array.isArray(issue.evidence) ? issue.evidence : [];
  const isKnown = existingEvidence.some(
    (item) => item.messageId !== null && item.messageId === evidence.messageId,
  );
  const mergedAppNames = [...new Set([...(issue.appNames ?? []), ...appNames])];
  const updated = isKnown
    ? issue
    : await updateRecord<BcIssueRecord>({
        client,
        objectNameSingular: 'bcIssue',
        id: issue.id,
        data: {
          evidence: [...existingEvidence, evidence].slice(-MAX_EVIDENCE),
          lastEvidenceAt: evidence.sentAt ?? new Date().toISOString(),
          appNames: mergedAppNames,
          history: appendHistory(issue.history, {
            actorMemberId: null,
            action: 'EVIDENCE_ADDED',
            note: evidence.excerpt.slice(0, 200),
          }),
        },
        selection: BC_ISSUE_SELECTION,
      });

  await touchIssueTask({ client, issue: updated, evidence });

  await recordActivity(client, {
    vipClientId: issue.vipClientId,
    type: 'ISSUE_UPDATED',
    title: `Client wrote again about: ${issue.title ?? 'open issue'}`,
    summary: evidence.excerpt,
    direction: 'INBOUND',
    topic: 'ISSUE',
    occurredAt: evidence.sentAt ?? undefined,
    sourceUrl: evidence.url,
    externalId:
      evidence.messageId === null ? null : `issue-evidence:${issue.id}:${evidence.messageId}`,
    metadata: { issueId: issue.id },
  });

  return updated;
};

const MAX_TASK_NOTES = 2_000;

const touchIssueTask = async ({
  client,
  issue,
  evidence,
}: {
  client: ApiClient;
  issue: BcIssueRecord;
  evidence: IssueEvidence;
}): Promise<void> => {
  if (issue.vipClientId === null || issue.status !== 'OPEN') {
    return;
  }

  const task = await readTaskByTriggerKey(client, buildIssueTaskKey(issue.id));

  if (task === null) {
    const vipClient = await readVipClient(client, issue.vipClientId);

    if (vipClient !== null) {
      await ensureIssueFollowUps({ client, issue, vipClient });
    }

    return;
  }

  const marker = evidence.messageId === null ? null : `message ${evidence.messageId}`;

  if (marker !== null && (task.history ?? []).some((entry) => entry.note?.includes(marker))) {
    return;
  }

  const isClosed = task.status === 'COMPLETED' || task.status === 'CANCELLED';
  const latest = `Latest client message: ${evidence.excerpt}`.slice(0, 500);
  const notes = [task.notes?.split('\n\nLatest client message:')[0] ?? '', latest]
    .filter((part) => part.length > 0)
    .join('\n\n')
    .slice(0, MAX_TASK_NOTES);

  await updateRecord({
    client,
    objectNameSingular: 'bcTask',
    id: task.id,
    data: {
      notes,
      ...(isClosed ? { status: 'TODO', completedAt: null } : {}),
      history: appendHistory(task.history, {
        actorMemberId: null,
        action: isClosed ? 'REOPENED' : 'EVIDENCE_ADDED',
        from: isClosed ? task.status : null,
        to: isClosed ? 'TODO' : null,
        note: `Client wrote again about the open issue (${marker ?? 'no message id'})`,
      }),
    },
  });
};

// Only an explicit BC action closes an issue; developer task completion and
// client silence never do. The linked follow-up tasks close with it.
export const closeClientIssue = async ({
  client,
  issue,
  action,
  actorMemberId,
  reason = null,
  now = new Date().toISOString(),
}: {
  client: ApiClient;
  issue: BcIssueRecord;
  action: 'RESOLVED' | 'DISMISSED';
  actorMemberId: string | null;
  reason?: string | null;
  now?: string;
}): Promise<BcIssueRecord> => {
  if (issue.status !== 'OPEN') {
    throw new Error('This issue is already closed.');
  }

  const updated = await updateRecord<BcIssueRecord>({
    client,
    objectNameSingular: 'bcIssue',
    id: issue.id,
    data: {
      status: action,
      resolvedAt: now,
      resolvedByMemberId: actorMemberId,
      dismissReason: action === 'DISMISSED' ? reason : null,
      history: appendHistory(issue.history, {
        actorMemberId,
        action: action === 'RESOLVED' ? 'CONFIRMED_RESOLVED' : 'DISMISSED_FALSE_POSITIVE',
        from: 'OPEN',
        to: action,
        note: reason,
        at: now,
      }),
    },
    selection: BC_ISSUE_SELECTION,
  });

  const linkedTasks = await listAllRecords<BcTaskRecord>({
    client,
    pluralName: 'bcTasks',
    filter: {
      issueId: { eq: issue.id },
      status: { in: ['TODO', 'IN_PROGRESS'] },
    },
    selection: BC_TASK_SELECTION,
  });

  for (const task of linkedTasks) {
    const nextStatus = action === 'RESOLVED' ? 'COMPLETED' : 'CANCELLED';

    await updateRecord({
      client,
      objectNameSingular: 'bcTask',
      id: task.id,
      data: {
        status: nextStatus,
        completedAt: nextStatus === 'COMPLETED' ? now : null,
        outcome:
          task.outcome ??
          (action === 'RESOLVED'
            ? 'Issue confirmed resolved by BC'
            : `Issue dismissed as false positive${reason ? `: ${reason}` : ''}`),
        history: appendHistory(task.history, {
          actorMemberId,
          action: 'STATUS_CHANGED',
          from: task.status,
          to: nextStatus,
          note: `Issue ${action.toLowerCase()}`,
          at: now,
        }),
      },
    });
  }

  await recordActivity(client, {
    vipClientId: issue.vipClientId,
    type: action === 'RESOLVED' ? 'ISSUE_RESOLVED' : 'ISSUE_DISMISSED',
    title:
      action === 'RESOLVED'
        ? `Issue confirmed resolved: ${issue.title ?? ''}`
        : `Issue dismissed as false positive: ${issue.title ?? ''}`,
    summary: reason,
    direction: 'INTERNAL',
    topic: 'ISSUE',
    isBcAuthored: action === 'RESOLVED',
    actorMemberId,
    occurredAt: now,
    metadata: { issueId: issue.id },
  });

  if (issue.vipClientId !== null) {
    await recomputeClientStatus({
      client,
      vipClientId: issue.vipClientId,
      actorMemberId,
      now,
    });
  }

  return updated;
};

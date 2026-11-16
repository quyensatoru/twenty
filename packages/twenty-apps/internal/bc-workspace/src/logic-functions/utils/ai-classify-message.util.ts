import { RestApiClient } from 'twenty-client-sdk/rest';

import { type ApiClient } from '../../types/api-client';
import { type BcIssueRecord, type IssueEvidence } from '../../types/bc-records';
import {
  decideClassificationAction,
  parseMessageClassification,
} from '../../utils/automation-classification.util';
import {
  buildCrispConversationUrl,
  CRISP_MESSAGE_SELECTION,
  type CrispMessageNode,
  readCrispConversation,
  readCrispMessage,
} from './automation-crisp.util';
import { acquireClientLock, releaseClientLock } from './automation-lock.util';
import {
  appendIssueEvidence,
  ensureIssueFollowUps,
  openClientIssue,
} from './issue-lifecycle.util';
import { listOpenIssues, readVipClient } from './client-store.util';
import { listAllRecords } from './list-all-records.util';
import { BC_ISSUE_SELECTION } from './record-selections';

const CONTEXT_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 600;

const buildSystemPrompt = (appNames: string[]): string =>
  [
    'You triage customer messages sent to the Business Consultant of a VIP client of Shopify apps.',
    'Reply with exactly one JSON object and nothing else:',
    '{"isIssue": boolean, "isHowTo": boolean, "matchesIssueId": string|null, "title": string, "classification": string, "appNames": string[], "summary": string, "confidence": number}',
    '- isIssue: true only when the LAST customer message reports a genuine defect, blocker, data problem, billing error or broken behavior.',
    '- isHowTo: true when it is a setup, configuration or how-to question, a feature request, a thank-you or small talk. Those are never issues.',
    '- matchesIssueId: the id of an open issue below when the last message is about the same problem, otherwise null.',
    '- title: at most 8 words naming the problem. classification: a reusable 2 to 5 word topic.',
    `- appNames: affected products among ${appNames.length > 0 ? appNames.join(', ') : 'the products mentioned'}; empty if unclear.`,
    '- summary: one sentence of evidence. confidence: 0 to 1.',
    'Write title, classification and summary in English.',
  ].join('\n');

const formatMessage = (message: CrispMessageNode): string =>
  `[${(message.sentAt ?? '').slice(0, 16).replace('T', ' ')}] ${
    message.sender === 'OPERATOR' ? 'Support' : 'Customer'
  }: ${(message.text ?? '').trim().slice(0, MAX_MESSAGE_LENGTH)}`;

const buildUserPrompt = ({
  messages,
  openIssues,
}: {
  messages: CrispMessageNode[];
  openIssues: BcIssueRecord[];
}): string =>
  [
    'Open issues of this client:',
    openIssues.length === 0
      ? '(none)'
      : openIssues
          .map(
            (issue) =>
              `- id=${issue.id} | ${issue.title ?? ''} | ${issue.classification ?? ''} | apps: ${(issue.appNames ?? []).join(', ')}`,
          )
          .join('\n'),
    '',
    'Conversation, oldest first; classify the LAST customer message:',
    messages.map(formatMessage).join('\n'),
  ].join('\n');

export type ClassificationOutcome =
  | 'skipped'
  | 'already-handled'
  | 'ignored'
  | 'appended'
  | 'opened'
  | 'deferred';

const findIssueHoldingMessage = async (
  client: ApiClient,
  vipClientId: string,
  messageId: string,
): Promise<BcIssueRecord | null> => {
  // Searched in memory: a LIKE filter on a JSON field is not something the
  // data API promises to support.
  const issues = await listAllRecords<BcIssueRecord>({
    client,
    pluralName: 'bcIssues',
    filter: { vipClientId: { eq: vipClientId } },
    selection: BC_ISSUE_SELECTION,
    orderBy: [{ createdAt: 'DescNullsLast' }],
    maxRecords: 500,
  });

  return (
    issues.find((issue) =>
      (Array.isArray(issue.evidence) ? issue.evidence : []).some(
        (item) => item.messageId === messageId,
      ),
    ) ?? null
  );
};

export const buildIssueLockName = (vipClientId: string): string => `issue:${vipClientId}`;

// Called from a queued job so a slow model never holds up the Crisp sync.
// Holding the client's issue lock keeps two messages classified at the same
// time from each opening an issue; the caller re-queues when it is taken.
export const classifyClientMessageLocked = async (input: {
  client: ApiClient;
  messageId: string;
  vipClientId: string;
}): Promise<{ outcome: ClassificationOutcome; issueId?: string }> => {
  const lockName = buildIssueLockName(input.vipClientId);
  const token = await acquireClientLock(lockName, 120_000);

  if (token === null) {
    return { outcome: 'deferred' };
  }

  try {
    return await classifyClientMessage(input);
  } finally {
    await releaseClientLock(lockName, token);
  }
};

// A retry finds the evidence it already stored and only finishes the steps
// that may not have run: the issue task, the timeline entry, the status.
export const classifyClientMessage = async ({
  client,
  messageId,
  vipClientId,
}: {
  client: ApiClient;
  messageId: string;
  vipClientId: string;
}): Promise<{ outcome: ClassificationOutcome; issueId?: string }> => {
  const [message, vipClient] = await Promise.all([
    readCrispMessage(client, messageId),
    readVipClient(client, vipClientId),
  ]);

  if (message === null || vipClient === null || message.conversationId === null) {
    return { outcome: 'skipped' };
  }

  const alreadyLinked = await findIssueHoldingMessage(client, vipClientId, messageId);

  if (alreadyLinked !== null) {
    if (alreadyLinked.status === 'OPEN') {
      await ensureIssueFollowUps({ client, issue: alreadyLinked, vipClient });
    }

    return { outcome: 'already-handled', issueId: alreadyLinked.id };
  }

  const [conversation, recentMessages, openIssues] = await Promise.all([
    readCrispConversation(client, message.conversationId),
    listAllRecords<CrispMessageNode>({
      client,
      pluralName: 'crispMessages',
      filter: {
        conversationId: { eq: message.conversationId },
        sentAt: { lte: message.sentAt ?? new Date().toISOString() },
      },
      selection: CRISP_MESSAGE_SELECTION,
      orderBy: [{ sentAt: 'DescNullsLast' }],
      maxRecords: CONTEXT_MESSAGES * 2,
    }),
    listOpenIssues(client, [vipClientId]),
  ]);

  const transcript = recentMessages
    .filter(
      (item) =>
        (item.text ?? '').trim().length > 0 &&
        !['note', 'event'].includes((item.messageType ?? '').toLowerCase()),
    )
    .slice(0, CONTEXT_MESSAGES)
    .reverse();
  const conversationAppName = conversation?.appName ?? null;
  const appNames = [
    ...new Set(
      [conversationAppName, ...openIssues.flatMap((issue) => issue.appNames ?? [])].filter(
        (name): name is string => typeof name === 'string' && name.length > 0,
      ),
    ),
  ];

  // A model outage throws, so the queue retries the job instead of dropping
  // the message.
  const response = await new RestApiClient().post<{ text?: string }>(
    '/rest/ai/generate-text',
    {
      systemPrompt: buildSystemPrompt(appNames),
      userPrompt: buildUserPrompt({ messages: transcript, openIssues }),
    },
  );
  const reply = typeof response?.text === 'string' ? response.text : '';
  const result = parseMessageClassification(
    reply,
    openIssues.map((issue) => issue.id),
  );
  const action = decideClassificationAction(result);

  if (result === null || action === 'IGNORE') {
    return { outcome: 'ignored' };
  }

  const evidence: IssueEvidence = {
    conversationId: message.conversationId,
    messageId: message.id,
    excerpt: (message.text ?? '').trim().slice(0, 500),
    sentAt: message.sentAt,
    url: conversation === null ? null : buildCrispConversationUrl(conversation),
  };

  if (action === 'APPEND') {
    const issue = openIssues.find((candidate) => candidate.id === result.matchesIssueId);

    if (issue === undefined) {
      return { outcome: 'ignored' };
    }

    await appendIssueEvidence({ client, issue, evidence, appNames: result.appNames });

    return { outcome: 'appended', issueId: issue.id };
  }

  const affectedApps =
    result.appNames.length > 0
      ? result.appNames
      : conversationAppName === null
        ? []
        : [conversationAppName];
  const { issue } = await openClientIssue({
    client,
    vipClient,
    title: result.title,
    summary: result.summary,
    classification: result.classification,
    appNames: affectedApps,
    source: 'AI',
    confidence: result.confidence,
    evidence: [evidence],
    detectedAt: message.sentAt ?? undefined,
  });

  return { outcome: 'opened', issueId: issue.id };
};

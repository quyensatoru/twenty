import { RestApiClient } from 'twenty-client-sdk/rest';

import { type ApiClient } from '../../types/api-client';
import { type SupportInboxSummary } from '../../types/support-inbox';
import {
  countConversationMessages,
  updateConversation,
} from './crisp-conversation-store.util';
import { executeWithRetry } from './execute-with-retry.util';

type TranscriptMessage = {
  text?: string | null;
  sender?: string | null;
  senderName?: string | null;
  messageType?: string | null;
  sentAt?: string | null;
};

// Enough for a long support thread; the oldest messages are dropped first
// because the summary is about where the chat stands now.
const MAX_TRANSCRIPT_MESSAGES = 120;
const MAX_MESSAGE_LENGTH = 700;
const MAX_TRANSCRIPT_LENGTH = 16_000;
const MAX_KNOWN_PROBLEMS = 30;
const PROVIDER_RETRY_DELAY_MS = 2_000;

const LANGUAGE_NAMES: Record<string, string> = {
  vi: 'Vietnamese',
  en: 'English',
};

const buildSystemPrompt = ({
  languageName,
  knownProblems,
}: {
  languageName: string;
  knownProblems: string[];
}): string =>
  [
    'You summarize customer support chats for the support team of Shopify apps (MIDA, BLOY and others).',
    'Reply with exactly one JSON object and nothing else: {"summary": string, "problem": string, "nextStep": string}.',
    '- summary: 2 to 4 markdown bullet points ("- "), each at most 20 words: what the customer needs, what support did, and where it stands now. Skip pleasantries and history that no longer matters.',
    '- problem: where the customer is stuck, as a short reusable category of 2 to 5 words (for example "App embed not enabled", "Points not awarded", "Plan and billing"). Use "" if the customer has no problem.',
    '- nextStep: the single concrete next action for support in at most 20 words, or "" if nothing is pending.',
    `Write all three values in ${languageName}.`,
    knownProblems.length > 0
      ? `Reuse one of these existing problem categories word for word when it fits, so the same problem is counted together: ${knownProblems.map((problem) => JSON.stringify(problem)).join(', ')}.`
      : '',
    'Lines marked "Internal note" are private notes between support agents: use them as context, never as something the customer said.',
  ]
    .filter((line) => line.length > 0)
    .join('\n');

const formatSpeaker = (message: TranscriptMessage): string => {
  const name =
    typeof message.senderName === 'string' && message.senderName.length > 0
      ? ` (${message.senderName})`
      : '';

  if (message.messageType === 'note') {
    return `Internal note${name}`;
  }

  return message.sender === 'OPERATOR' ? `Support${name}` : 'Customer';
};

export const buildTranscript = (messages: TranscriptMessage[]): string => {
  const lines = messages
    .filter(
      (message) =>
        typeof message.text === 'string' &&
        message.text.trim().length > 0 &&
        message.messageType !== 'event',
    )
    .map((message) => {
      const text = (message.text ?? '').trim().replace(/\s+\n/g, '\n');
      const clipped =
        text.length > MAX_MESSAGE_LENGTH
          ? `${text.slice(0, MAX_MESSAGE_LENGTH)}…`
          : text;

      return `[${(message.sentAt ?? '').slice(0, 16).replace('T', ' ')}] ${formatSpeaker(message)}: ${clipped}`;
    });

  const kept: string[] = [];
  let length = 0;

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    length += lines[index].length + 1;

    if (length > MAX_TRANSCRIPT_LENGTH) {
      break;
    }

    kept.unshift(lines[index]);
  }

  return kept.join('\n');
};

const readJsonObject = (text: string): Record<string, unknown> | null => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end <= start) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));

    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const readValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// Models sometimes ignore the JSON envelope; the whole reply then becomes the
// summary rather than an error the agent cannot act on.
export const parseSummaryReply = (
  text: string,
): { summary: string; problem: string | null; nextStep: string | null } => {
  const parsed = readJsonObject(text);
  const summary = readValue(parsed?.summary) ?? text.trim();

  return {
    summary,
    problem: readValue(parsed?.problem),
    nextStep: readValue(parsed?.nextStep),
  };
};

const generateText = (systemPrompt: string, userPrompt: string) =>
  new RestApiClient().post<{ text?: string }>('/rest/ai/generate-text', {
    systemPrompt,
    userPrompt,
  });

const readKnownProblems = async (client: ApiClient): Promise<string[]> => {
  const result = await executeWithRetry<{
    crispConversations?: { edges?: { node: { aiProblem?: string | null } }[] };
  }>(() =>
    client.query({
      crispConversations: {
        __args: {
          filter: {
            and: [
              { aiProblem: { is: 'NOT_NULL' } },
              { aiProblem: { neq: '' } },
            ],
          },
          first: 200,
          orderBy: [{ aiSummaryAt: 'DescNullsLast' }],
        },
        edges: { node: { aiProblem: true } },
      },
    }),
  );

  return [
    ...new Set(
      (result?.crispConversations?.edges ?? [])
        .map((edge) => edge.node.aiProblem?.trim() ?? '')
        .filter((problem) => problem.length > 0),
    ),
  ].slice(0, MAX_KNOWN_PROBLEMS);
};

export const summarizeConversation = async ({
  client,
  conversationId,
  language,
}: {
  client: ApiClient;
  conversationId: string;
  language: string;
}): Promise<SupportInboxSummary> => {
  const [messageResult, knownProblems] = await Promise.all([
    executeWithRetry<{
      crispMessages?: { edges?: { node: TranscriptMessage }[] };
    }>(() =>
      client.query({
        crispMessages: {
          __args: {
            filter: { conversationId: { eq: conversationId } },
            first: MAX_TRANSCRIPT_MESSAGES,
            orderBy: [{ sentAt: 'DescNullsLast' }],
          },
          edges: {
            node: {
              text: true,
              sender: true,
              senderName: true,
              messageType: true,
              sentAt: true,
            },
          },
        },
      }),
    ),
    readKnownProblems(client),
  ]);
  const messages = (messageResult?.crispMessages?.edges ?? [])
    .map((edge) => edge.node)
    .reverse();
  const transcript = buildTranscript(messages);

  if (transcript.length === 0) {
    throw new Error('This conversation has no messages to summarize yet.');
  }

  const systemPrompt = buildSystemPrompt({
    languageName: LANGUAGE_NAMES[language] ?? LANGUAGE_NAMES.vi,
    knownProblems,
  });
  const userPrompt = `Support chat transcript, oldest first:\n\n${transcript}`;
  let reply: { text?: string };

  // Free provider tiers answer with short-lived upstream rate limits, which
  // the server surfaces as a plain 400.
  try {
    reply = await generateText(systemPrompt, userPrompt);
  } catch {
    await new Promise((resolve) =>
      setTimeout(resolve, PROVIDER_RETRY_DELAY_MS),
    );
    reply = await generateText(systemPrompt, userPrompt);
  }

  const text = reply?.text ?? '';

  if (text.trim().length === 0) {
    throw new Error('The AI model returned an empty reply. Try again.');
  }

  const { summary, problem, nextStep } = parseSummaryReply(text);
  const summaryRecord: SupportInboxSummary = {
    aiSummary: summary,
    aiProblem: problem,
    aiNextStep: nextStep,
    aiSummaryAt: new Date().toISOString(),
    aiSummaryMessageCount: await countConversationMessages(
      client,
      conversationId,
    ),
  };

  await updateConversation(client, conversationId, summaryRecord);

  return summaryRecord;
};

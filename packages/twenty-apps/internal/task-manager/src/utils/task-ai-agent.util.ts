import { isObject, isString } from '@sniptt/guards';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { TASK_AI_SYSTEM_PROMPT } from '../constants/task-ai';

const TASK_AI_OPERATIONS = ['tree', 'file', 'search', 'diff', 'answer'];

// Models often wrap the JSON in Markdown fences or prose, and reasoning models
// can return an empty or truncated text when they run out of output tokens.
const parseTaskAiReply = (text: unknown): unknown => {
  if (!isString(text)) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

const TASK_AI_PROVIDER_RETRY_DELAY_MS = 2000;

const generateText = (input: string) =>
  new RestApiClient().post<{ text: string }>('/rest/ai/generate-text', {
    systemPrompt: TASK_AI_SYSTEM_PROMPT,
    userPrompt: input,
  });

export const runTaskAiAgent = async ({ input }: { input: string }) => {
  let response: { text: string };
  // Free provider tiers answer with short-lived upstream rate limits, which
  // the server surfaces as a plain 400.
  try {
    response = await generateText(input);
  } catch {
    await new Promise((resolve) =>
      setTimeout(resolve, TASK_AI_PROVIDER_RETRY_DELAY_MS),
    );
    response = await generateText(input);
  }
  const result = parseTaskAiReply(response?.text);
  if (
    !isObject(result) ||
    !('operation' in result) ||
    !('argument' in result) ||
    !isString(result.operation) ||
    !isString(result.argument)
  ) {
    return {
      success: true,
      status: 'INVALID_REPLY',
      error: 'The AI reply was not a valid JSON operation.',
      result: null,
    };
  }
  if (!TASK_AI_OPERATIONS.includes(result.operation)) {
    throw new Error(
      'The AI returned an invalid read-only response. Ask again.',
    );
  }
  return {
    success: true,
    status: 'COMPLETED',
    error: null,
    result: { operation: result.operation, argument: result.argument },
  };
};

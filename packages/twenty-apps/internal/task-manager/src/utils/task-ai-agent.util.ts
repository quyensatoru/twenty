import { isObject, isString } from '@sniptt/guards';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { TASK_AI_SYSTEM_PROMPT } from '../constants/task-ai';

const TASK_AI_OPERATIONS = ['tree', 'file', 'search', 'diff', 'answer'];

const escapeControlCharactersInStrings = (json: string) => {
  let output = '';
  let isInString = false;
  let isEscaped = false;
  for (const character of json) {
    if (isInString && !isEscaped && character === '\n') output += '\\n';
    else if (isInString && !isEscaped && character === '\r') output += '\\r';
    else if (isInString && !isEscaped && character === '\t') output += '\\t';
    else output += character;
    if (isEscaped) isEscaped = false;
    else if (character === '\\') isEscaped = true;
    else if (character === '"') isInString = !isInString;
  }
  return output;
};

const tryParseJson = (json: string): unknown => {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
};

const readLooseAnswerArgument = (text: string) => {
  const match = text.match(
    /"operation"\s*:\s*"answer"\s*,\s*"argument"\s*:\s*"([\s\S]*)"\s*\}/,
  );
  if (match === null) return null;
  return match[1].replace(/\\(["\\/nrt])/g, (_, escaped: string) =>
    escaped === 'n'
      ? '\n'
      : escaped === 'r'
        ? '\r'
        : escaped === 't'
          ? '\t'
          : escaped,
  );
};

// Models wrap the JSON in fences or prose, put raw newlines and quotes inside
// long Markdown answers, or skip the JSON envelope for the final answer, and
// reasoning models can return an empty or truncated text.
export const parseTaskAiReply = (text: unknown): unknown => {
  if (!isString(text) || text.trim() === '') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const json = text.slice(start, end + 1);
    const parsed =
      tryParseJson(json) ??
      tryParseJson(escapeControlCharactersInStrings(json));
    if (parsed !== undefined) return parsed;
    const answer = readLooseAnswerArgument(json);
    if (answer !== null) return { operation: 'answer', argument: answer };
  }
  if (!/"operation"\s*:/.test(text))
    return { operation: 'answer', argument: text.trim() };
  return null;
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

import { isObject, isString } from '@sniptt/guards';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { TASK_AI_SYSTEM_PROMPT } from '../constants/task-ai';

export const runTaskAiAgent = async ({ input }: { input: string }) => {
  const response = await new RestApiClient().post<{ text: string }>(
    '/rest/ai/generate-text',
    {
      systemPrompt: TASK_AI_SYSTEM_PROMPT,
      userPrompt: input,
    },
  );
  const result: unknown = JSON.parse(response.text);
  if (
    !isObject(result) ||
    !('operation' in result) ||
    !('argument' in result) ||
    !isString(result.operation) ||
    !isString(result.argument) ||
    !['tree', 'file', 'search', 'diff', 'answer'].includes(result.operation)
  ) {
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

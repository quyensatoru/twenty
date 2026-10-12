import { taskAiPrivateStorage as kv } from './task-ai-private-storage.util';
import { type TaskAiRunEvent } from './task-ai-run-events.util';

export type TaskAiAnswer = {
  question: string;
  answer: string;
  sha: string;
  repository: string;
  sources?: { repository: string; sha: string }[];
};
export type TaskAiRunState = {
  runId: string;
  status: 'running' | 'completed' | 'cancelled' | 'failed';
  operation: string;
  question?: string;
  events?: TaskAiRunEvent[];
  updatedAt: number;
};
export const taskAiStateKeys = (memberId: string, issueId: string) => {
  const prefix = `task-ai:${memberId}:${issueId}`;
  return {
    history: `${prefix}:history`,
    run: `${prefix}:run`,
    cancel: (runId: string) => `${prefix}:cancel:${runId}`,
  };
};
export const readTaskAiHistory = async (key: string): Promise<TaskAiAnswer[]> =>
  (await kv.get<TaskAiAnswer[]>(key)) ?? [];
export const appendTaskAiHistory = async (
  key: string,
  answer: TaskAiAnswer,
) => {
  const history = [...(await readTaskAiHistory(key)), answer].slice(-50);
  while (JSON.stringify(history).length > 200000 && history.length > 1)
    history.shift();
  await kv.set(key, history);
};

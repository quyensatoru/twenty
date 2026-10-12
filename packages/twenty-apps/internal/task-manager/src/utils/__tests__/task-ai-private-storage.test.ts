import { beforeEach, describe, expect, it, vi } from 'vitest';
const storage = vi.hoisted(() => new Map<string, unknown>());
vi.mock('twenty-sdk/logic-function', () => ({
  kv: {
    get: async (key: string) => storage.get(key) ?? null,
    set: async (key: string, value: unknown) => {
      storage.set(key, value);
    },
    delete: async (key: string) => storage.delete(key),
  },
}));
import { taskAiPrivateStorage } from '../task-ai-private-storage.util';
beforeEach(() => {
  storage.clear();
  vi.stubEnv('TASK_AI_STORAGE_SECRET', 'a'.repeat(64));
});
describe('encrypted private AI storage', () => {
  it('stores neither member keys nor message text and restores the authenticated value', async () => {
    await taskAiPrivateStorage.set('member-a:issue-a', {
      answer: 'private sensitive message',
    });
    expect(JSON.stringify([...storage.entries()])).not.toContain('member-a');
    expect(JSON.stringify([...storage.entries()])).not.toContain(
      'private sensitive message',
    );
    expect(await taskAiPrivateStorage.get('member-a:issue-a')).toEqual({
      answer: 'private sensitive message',
    });
    expect(await taskAiPrivateStorage.get('member-b:issue-a')).toBeNull();
  });
  it('rejects ciphertext copied between member keys', async () => {
    await taskAiPrivateStorage.set('member-a:issue-a', 'private');
    const firstValue = [...storage.values()][0];
    await taskAiPrivateStorage.set('member-b:issue-a', 'other');
    const secondKey = [...storage.keys()][1];
    storage.set(secondKey, firstValue);
    await expect(
      taskAiPrivateStorage.get('member-b:issue-a'),
    ).rejects.toThrow();
  });
  it('fails closed without a server secret', async () => {
    vi.stubEnv('TASK_AI_STORAGE_SECRET', '');
    await expect(taskAiPrivateStorage.get('member-a:issue-a')).rejects.toThrow(
      'Configure',
    );
  });
});

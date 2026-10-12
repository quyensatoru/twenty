import { beforeEach, describe, expect, it, vi } from 'vitest';
const runtime = vi.hoisted(() => ({ post: vi.fn(), options: vi.fn() }));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    constructor(options: unknown) {
      runtime.options(options);
    }
    post = runtime.post;
  },
}));
import { runTaskAiAgent } from '../task-ai-agent.util';
beforeEach(() => {
  vi.clearAllMocks();
});
describe('tool-free provider adapter', () => {
  it('uses the existing provider with only prompt text and the caller token', async () => {
    runtime.post.mockResolvedValue({
      text: JSON.stringify({ operation: 'answer', argument: 'Advice' }),
    });
    expect(await runTaskAiAgent({ input: 'Question' })).toMatchObject({
      success: true,
      result: { operation: 'answer', argument: 'Advice' },
    });
    expect(runtime.options).toHaveBeenCalledWith(undefined);
    expect(runtime.post.mock.calls[0][0]).toBe('/rest/ai/generate-text');
    expect(Object.keys(runtime.post.mock.calls[0][1])).toEqual([
      'systemPrompt',
      'userPrompt',
    ]);
  });
  it('reads the JSON operation out of Markdown fences and prose', async () => {
    runtime.post.mockResolvedValue({
      text: 'Here you go:\n```json\n{"operation":"tree","argument":""}\n```',
    });
    expect(await runTaskAiAgent({ input: 'Question' })).toMatchObject({
      status: 'COMPLETED',
      result: { operation: 'tree', argument: '' },
    });
  });
  it.each(['', '{"operation":"answer","argument":"cut'])(
    'reports an empty or truncated reply as unreadable instead of throwing (%j)',
    async (text) => {
      runtime.post.mockResolvedValue({ text });
      expect(await runTaskAiAgent({ input: 'Question' })).toMatchObject({
        status: 'INVALID_REPLY',
        result: null,
      });
    },
  );
  it('retries one failed provider request before giving up', async () => {
    vi.useFakeTimers();
    try {
      runtime.post
        .mockRejectedValueOnce(new Error('Bad Request'))
        .mockResolvedValueOnce({
          text: JSON.stringify({ operation: 'answer', argument: 'Advice' }),
        });
      const pending = runTaskAiAgent({ input: 'Question' });
      await vi.advanceTimersByTimeAsync(2000);
      expect(await pending).toMatchObject({ status: 'COMPLETED' });
      expect(runtime.post).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
  it('rejects non-read operations returned by a model', async () => {
    runtime.post.mockResolvedValue({
      text: JSON.stringify({ operation: 'write', argument: 'malicious' }),
    });
    await expect(runTaskAiAgent({ input: 'Question' })).rejects.toThrow(
      'read-only',
    );
  });
});

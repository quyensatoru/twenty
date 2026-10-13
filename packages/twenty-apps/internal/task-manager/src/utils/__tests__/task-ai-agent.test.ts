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
  it.each([
    [
      'raw newlines inside the answer string',
      '{"operation":"answer","argument":"## Advice\nUse `parse()`\n- done"}',
      '## Advice\nUse `parse()`\n- done',
    ],
    [
      'unescaped quotes and code braces inside the answer string',
      '{"operation":"answer","argument":"Call "parse" in function f() { return 1; }"}',
      'Call "parse" in function f() { return 1; }',
    ],
    [
      'a Markdown answer without the JSON envelope',
      '## Advice\nThe parser lives in `src/parse.ts`.',
      '## Advice\nThe parser lives in `src/parse.ts`.',
    ],
  ])('accepts %s as the answer', async (_, text, argument) => {
    runtime.post.mockResolvedValue({ text });
    expect(await runTaskAiAgent({ input: 'Question' })).toMatchObject({
      status: 'COMPLETED',
      result: { operation: 'answer', argument },
    });
  });
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
  it('ends every prompt by asking for plain text instead of a function call', async () => {
    runtime.post.mockResolvedValue({
      text: JSON.stringify({ operation: 'answer', argument: 'Advice' }),
    });
    await runTaskAiAgent({ input: 'Question' });
    const { userPrompt } = runtime.post.mock.calls[0][1] as {
      userPrompt: string;
    };
    expect(userPrompt.startsWith('Question')).toBe(true);
    expect(userPrompt).toMatch(/never emit a function call\.$/);
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

describe('read requests sent in a loose shape', () => {
  it('turns an object argument into the JSON string the loop expects', async () => {
    runtime.post.mockResolvedValue({
      text: JSON.stringify({
        operation: 'search',
        argument: { repositoryId: 'repo-1', argument: { query: 'parse' } },
      }),
    });
    const result = await runTaskAiAgent({ input: 'Question' });
    expect(JSON.parse(result.result!.argument)).toEqual({
      repositoryId: 'repo-1',
      argument: { query: 'parse' },
    });
  });
  it('treats a missing argument as the repository root', async () => {
    runtime.post.mockResolvedValue({ text: '{"operation":"tree"}' });
    expect(await runTaskAiAgent({ input: 'Question' })).toMatchObject({
      status: 'COMPLETED',
      result: { operation: 'tree', argument: '' },
    });
  });
});

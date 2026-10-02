import { createFrontComponentUploadAnswerRegistry } from '@/host/uploads/utils/createFrontComponentUploadAnswerRegistry';

describe('createFrontComponentUploadAnswerRegistry', () => {
  it('should answer the handle the guest resolved', async () => {
    const registry = createFrontComponentUploadAnswerRegistry();
    const answer = registry.waitForAnswer('handle-1');

    registry.applyResolutions([
      { handle: 'handle-1', url: 'https://files.test/a.png' },
    ]);

    await expect(answer).resolves.toBe('https://files.test/a.png');
  });

  it('should match each file to its own handle whatever order they come back in', async () => {
    const registry = createFrontComponentUploadAnswerRegistry();
    const first = registry.waitForAnswer('handle-1');
    const second = registry.waitForAnswer('handle-2');

    registry.applyResolutions([
      { handle: 'handle-2', url: 'https://files.test/b.png' },
      { handle: 'handle-1', url: 'https://files.test/a.png' },
    ]);

    await expect(first).resolves.toBe('https://files.test/a.png');
    await expect(second).resolves.toBe('https://files.test/b.png');
  });

  it('should report a refusal as no url rather than leaving the caller waiting', async () => {
    const registry = createFrontComponentUploadAnswerRegistry();
    const answer = registry.waitForAnswer('handle-1');

    registry.applyResolutions([{ handle: 'handle-1', url: null }]);

    await expect(answer).resolves.toBeNull();
  });

  it('should ignore a resolution for a handle it is no longer waiting on', async () => {
    const registry = createFrontComponentUploadAnswerRegistry();
    const answer = registry.waitForAnswer('handle-1');
    const resolution = { handle: 'handle-1', url: 'https://files.test/a.png' };

    registry.applyResolutions([resolution]);
    registry.applyResolutions([resolution]);

    await expect(answer).resolves.toBe('https://files.test/a.png');
  });

  it('should abandon everything still pending when the editor goes away', async () => {
    const registry = createFrontComponentUploadAnswerRegistry();
    const first = registry.waitForAnswer('handle-1');
    const second = registry.waitForAnswer('handle-2');

    registry.abandonAll();

    await expect(first).resolves.toBeNull();
    await expect(second).resolves.toBeNull();
  });

  it('should stop waiting on a guest that never answers', async () => {
    jest.useFakeTimers();

    try {
      const registry = createFrontComponentUploadAnswerRegistry();
      const answer = registry.waitForAnswer('handle-1');

      jest.advanceTimersByTime(60_000);

      await expect(answer).resolves.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});

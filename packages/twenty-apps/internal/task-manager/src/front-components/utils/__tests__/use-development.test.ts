// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
  },
}));
import { useDevelopment } from '../../hooks/use-development';

let root: Root;
let container: HTMLDivElement;
const responses: ((value: unknown) => void)[] = [];
const Probe = ({ issueId }: { issueId: string }) => {
  const { data, isLoading } = useDevelopment(issueId);
  return createElement(
    'div',
    { role: 'status' },
    isLoading ? 'Loading' : data.issueKey,
  );
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  responses.length = 0;
  post
    .mockReset()
    .mockImplementation(
      () => new Promise((resolve) => responses.push(resolve)),
    );
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const reply = (issueKey: string) => ({
  success: true,
  issue: { issueKey, projectId: 'project-1' },
  links: [],
  deliveries: [],
  repositories: [],
  connections: [],
});

describe('development panel loading', () => {
  it('does not display the previous issue when an older request finishes later', async () => {
    await act(async () =>
      root.render(createElement(Probe, { issueId: 'issue-1' })),
    );
    await act(async () =>
      root.render(createElement(Probe, { issueId: 'issue-2' })),
    );
    await act(async () => responses[1](reply('PROJ-2')));
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'PROJ-2',
    );
    await act(async () => responses[0](reply('PROJ-1')));
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'PROJ-2',
    );
  });
  it('polls again after a queued sync can have finished', async () => {
    await act(async () =>
      root.render(createElement(Probe, { issueId: 'issue-1' })),
    );
    await act(async () => responses[0](reply('PROJ-1')));
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(responses).toHaveLength(2);
    await act(async () => responses[1](reply('PROJ-1 updated')));
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'PROJ-1 updated',
    );
  });
});

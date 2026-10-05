import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APPEND_ISSUE_ATTACHMENT_ROUTE_PATH } from '../../../constants/route-paths';
import { appendIssueAttachment } from '../append-issue-attachment.util';
import { postAppRoute } from '../post-app-route.util';

vi.mock('../post-app-route.util', () => ({
  postAppRoute: vi.fn(),
}));

const mockedPostAppRoute = vi.mocked(postAppRoute);

describe('appendIssueAttachment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the file to the append route', async () => {
    mockedPostAppRoute.mockResolvedValue({ appended: true });

    await appendIssueAttachment('issue-1', {
      fileId: 'file-1',
      label: 'screenshot.png',
    });

    expect(mockedPostAppRoute).toHaveBeenCalledWith(
      APPEND_ISSUE_ATTACHMENT_ROUTE_PATH,
      {
        issueId: 'issue-1',
        file: { fileId: 'file-1', label: 'screenshot.png' },
      },
    );
  });

  it('serializes concurrent appends for the same issue', async () => {
    const order: string[] = [];

    mockedPostAppRoute.mockImplementation(async (path, body) => {
      const fileId = (body as { file: { fileId: string } }).file.fileId;
      order.push(`start-${fileId}`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push(`end-${fileId}`);
      return { appended: true };
    });

    await Promise.all([
      appendIssueAttachment('issue-1', { fileId: 'file-1', label: 'a.png' }),
      appendIssueAttachment('issue-1', { fileId: 'file-2', label: 'b.png' }),
    ]);

    expect(order).toEqual([
      'start-file-1',
      'end-file-1',
      'start-file-2',
      'end-file-2',
    ]);
  });
});

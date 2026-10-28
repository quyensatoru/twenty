// @vitest-environment jsdom
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post, mobile, navigate } = vi.hoisted(() => ({
  post: vi.fn(),
  mobile: { value: false },
  navigate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
    resolveUrl = () => 'http://localhost:3000';
  },
}));
vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string) => text,
  navigate,
  enqueueSnackbar: vi.fn(),
  copyToClipboard: vi.fn(),
  useLocale: () => 'en',
  getApplicationVariable: () => undefined,
  useFrontComponentExecutionContext: (selector: (context: object) => unknown) =>
    selector({}),
  AppPath: { RecordShowPage: '/object/:objectNameSingular/:objectRecordId' },
}));
vi.mock('../../hooks/use-is-mobile', () => ({
  useIsMobile: () => mobile.value,
}));
vi.mock('../../hooks/use-issue-detail', () => ({
  useIssueDetail: (issueId: string) => ({
    isLoading: false,
    loadError: null,
    reload: vi.fn(),
    data: {
      issue: {
        id: issueId,
        title: 'Issue with linked records',
        issueKey: 'DEMO-1',
        projectId: 'project-1',
      },
      merchants: [{ id: 'merchant-1', name: 'Demo merchant' }],
      project: { id: 'project-1', name: 'Demo project' },
      issueComments: [],
      childIssues: [],
      parentIssue: null,
      worklogs: [],
      issueHistories: [],
      issueStatuses: [],
      sprints: [],
      epics: [],
      members: [],
      assignableMembers: [],
      attachments: [],
      canWrite: true,
      canSoftDelete: false,
      canManageViews: false,
      issueViewSettings: { hiddenDetailFields: [] },
      currentWorkspaceMemberId: null,
    },
  }),
}));
vi.mock('../../hooks/use-discussion-state', () => ({
  useDiscussionState: () => ({
    snapshot: null,
    error: null,
    isPermissionDenied: false,
    act: vi.fn(),
    reload: vi.fn(),
  }),
}));
vi.mock('../../components/issue-ai-activity-tab', () => ({
  IssueAiActivityTab: () => null,
}));
vi.mock('../../components/issue-comment-list', () => ({
  IssueCommentList: () => {
    const [value, setValue] = useState('');
    return createElement('textarea', {
      'aria-label': 'Comment draft',
      value,
      onChange: (event: { target: { value: string } }) =>
        setValue(event.target.value),
    });
  },
}));
vi.mock('../../components/merchant-custom-settings-panel', () => ({
  MerchantCustomSettingsPanel: () =>
    createElement('div', null, 'Merchant settings'),
}));
import { TaskBoardDetail } from '../../components/task-board-detail';

let root: Root;
let container: HTMLDivElement;
const close = vi.fn();
const renderModal = (issueId = 'issue-1') =>
  act(async () =>
    root.render(
      createElement(TaskBoardDetail, {
        issueId,
        navIssueIds: ['issue-1', 'issue-2'],
        onSelectIssue: vi.fn(),
        onClose: close,
        boardPath: '/page/board',
        onCardChanged: vi.fn(),
      }),
    ),
  );
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  mobile.value = false;
  post.mockImplementation(async (path: string) => {
    if (path.endsWith('/issue-conversations'))
      return {
        success: true,
        conversations: [
          {
            id: 'chat-1',
            visitorName: 'Demo visitor',
            visitorEmail: null,
            shopDomain: null,
            appName: 'Demo',
            status: 'RESOLVED',
            waitingSince: null,
          },
        ],
      };
    if (path.endsWith('/inbox/messages'))
      return {
        success: true,
        conversation: {
          id: 'chat-1',
          visitorName: 'Demo visitor',
          visitorEmail: null,
          status: 'RESOLVED',
          appName: 'Demo',
          shopDomain: null,
          waitingSince: null,
          websiteId: null,
          sessionId: null,
          merchant: null,
        },
        messages: [
          {
            id: 'message-1',
            text: 'Customer message',
            sender: 'USER',
            senderName: null,
            sentAt: '2026-10-14T00:00:00Z',
            messageType: 'text',
            content: null,
          },
        ],
        hasOlder: false,
      };
    if (path.endsWith('/merchant-preview'))
      return {
        success: true,
        issues: [],
      };
    if (path.endsWith('/merchant-conversations'))
      return { success: true, conversations: [] };
    return { success: true, merchants: [] };
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('issue modal linked records', () => {
  it('opens merchant and chat in place, preserving the comment draft and issue scroll', async () => {
    const user = userEvent.setup();
    await renderModal();
    const draft = getByRole(container, 'textbox', {
      name: 'Comment draft',
    }) as HTMLTextAreaElement;
    await act(async () => user.type(draft, 'Unsent comment'));
    const issueColumn = draft.closest('section')?.parentElement;
    if (issueColumn) issueColumn.scrollTop = 150;
    await act(async () =>
      user.click(getByRole(container, 'button', { name: /Demo merchant/ })),
    );
    expect(
      getByRole(container, 'region', { name: 'Linked record preview' }),
    ).toBeDefined();
    expect(draft.value).toBe('Unsent comment');
    expect(navigate).not.toHaveBeenCalled();
    if (issueColumn) expect(issueColumn.scrollTop).toBe(150);
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Close preview' })),
    );
    expect(
      queryByRole(container, 'region', { name: 'Linked record preview' }),
    ).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Open conversation' })),
    );
    expect(
      getByRole(container, 'log', { name: 'Conversation messages' })
        .textContent,
    ).toContain('Customer message');
    expect(draft.value).toBe('Unsent comment');
    expect(close).not.toHaveBeenCalled();
  });
  it('Escape returns from the mobile preview before dismissing the issue', async () => {
    mobile.value = true;
    const user = userEvent.setup();
    await renderModal();
    const draft = getByRole(container, 'textbox', {
      name: 'Comment draft',
    }) as HTMLTextAreaElement;
    await act(async () => user.type(draft, 'Mobile draft'));
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Open conversation' })),
    );
    expect(
      queryByRole(container, 'textbox', { name: 'Comment draft' }),
    ).toBeNull();
    await act(async () =>
      fireEvent.keyDown(getByRole(container, 'dialog'), { key: 'Escape' }),
    );
    expect(
      (
        getByRole(container, 'textbox', {
          name: 'Comment draft',
        }) as HTMLTextAreaElement
      ).value,
    ).toBe('Mobile draft');
    expect(close).not.toHaveBeenCalled();
    await act(async () =>
      fireEvent.keyDown(getByRole(container, 'dialog'), { key: 'Escape' }),
    );
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('clears the preview when moving to another issue', async () => {
    const user = userEvent.setup();
    await renderModal();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Open conversation' })),
    );
    await renderModal('issue-2');
    expect(
      queryByRole(container, 'region', { name: 'Linked record preview' }),
    ).toBeNull();
  });
});

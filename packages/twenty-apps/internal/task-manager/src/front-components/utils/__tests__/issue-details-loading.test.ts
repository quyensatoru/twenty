// @vitest-environment jsdom
import {
  getByRole,
  getByText,
  queryByRole,
  queryByText,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post, openSidePanelPage } = vi.hoisted(() => ({
  post: vi.fn(),
  openSidePanelPage: vi.fn(),
}));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
  },
}));
vi.mock('twenty-sdk/define', () => ({
  defineFrontComponent: ({ component }: { component: ComponentType }) =>
    component,
}));
vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string) => text,
  useRecordId: () => 'issue-1',
  openSidePanelPage,
  SidePanelPages: { ViewRecord: 'view-record' },
  enqueueSnackbar: vi.fn(),
}));

import issueFieldsDefinition from '../../issue-fields.front-component';

const IssueFields = issueFieldsDefinition as unknown as ComponentType;

let root: Root;
let container: HTMLDivElement;
const responses = new Map<string, (value: unknown) => void>();
const replyDetail = (value: unknown) =>
  responses.get('/s/task-manager/issue-detail')!(value);
const replyConversations = (value: unknown) =>
  responses.get('/s/customer-support/issue-conversations')!(value);
const detail = {
  success: true,
  issue: { id: 'issue-1', issueKey: 'OPS-4', projectId: 'project-1' },
  canWrite: false,
};
const conversation = {
  id: 'conversation-1',
  visitorName: 'Customer',
  visitorEmail: null,
  shopDomain: null,
  appName: 'Support',
  status: 'RESOLVED',
  waitingSince: null,
};

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  responses.clear();
  post
    .mockReset()
    .mockImplementation(
      (path: string) => new Promise((resolve) => responses.set(path, resolve)),
    );
  openSidePanelPage.mockReset();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('issue Details loading', () => {
  it('keeps the Details heading while the issue is loading', async () => {
    await act(async () => root.render(createElement(IssueFields)));
    expect(getByText(container, 'Details')).toBeDefined();
    expect(
      getByRole(container, 'status', { name: 'Loading details' }),
    ).toBeDefined();
    await act(async () => replyDetail(detail));
    expect(
      queryByRole(container, 'status', { name: 'Loading details' }),
    ).toBeNull();
    expect(getByRole(container, 'button', { name: 'Status' })).toBeDefined();
  });

  it('keeps Conversations visible while loading and opens the linked record', async () => {
    const user = userEvent.setup();
    await act(async () => root.render(createElement(IssueFields)));
    await act(async () => replyDetail(detail));
    const label = getByText(container, 'Chats');
    expect(
      getByRole(container, 'status', { name: 'Loading conversations' }),
    ).toBeDefined();
    await act(async () =>
      replyConversations({ success: true, conversations: [conversation] }),
    );
    expect(getByText(container, 'Chats')).toBe(label);
    expect(
      queryByRole(container, 'status', { name: 'Loading conversations' }),
    ).toBeNull();
    expect(getByText(container, 'Customer')).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Open conversation' })),
    );
    expect(openSidePanelPage).toHaveBeenCalledWith({
      page: 'view-record',
      objectNameSingular: 'crispConversation',
      recordId: 'conversation-1',
    });
  });

  it.each([
    { success: true, conversations: [] },
    { success: false, error: 'Customer Support is unavailable' },
  ])(
    'keeps the empty Conversations field after response %j',
    async (response) => {
      await act(async () => root.render(createElement(IssueFields)));
      await act(async () => replyDetail(detail));
      await act(async () => replyConversations(response));
      // An empty field folds under its section's "empty fields" line.
      expect(queryByText(container, 'No conversations')).toBeNull();
      await act(async () =>
        userEvent
          .setup()
          .click(getByRole(container, 'button', { name: /Chats/ })),
      );
      expect(getByText(container, 'Chats')).toBeDefined();
      expect(getByText(container, 'No conversations')).toBeDefined();
      expect(
        queryByRole(container, 'status', { name: 'Loading conversations' }),
      ).toBeNull();
    },
  );
});

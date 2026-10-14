// @vitest-environment jsdom
import { getByRole, getByText } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { context, navigate, post, metadata } = vi.hoisted(() => ({
  context: {
    locationHash: '',
    locationPathname: '/page/inbox-page',
    isMobile: false,
  },
  navigate: vi.fn().mockResolvedValue(undefined),
  post: vi.fn(),
  metadata: vi.fn(),
}));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
  },
}));
vi.mock('twenty-client-sdk/metadata', () => ({
  MetadataApiClient: class {
    query = metadata;
  },
}));
vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string) => text,
  useRecordId: () => 'conversation-1',
  useLocationHash: () => context.locationHash,
  useFrontComponentExecutionContext: (
    selector: (value: typeof context) => unknown,
  ) => selector(context),
  useLocale: () => 'en',
  navigate,
  closeSidePanel: vi.fn().mockResolvedValue(undefined),
  AppPath: { PageLayoutPage: '/page/:pageLayoutId' },
  enqueueSnackbar: vi.fn(),
  copyToClipboard: vi.fn(),
  openSidePanelPage: vi.fn(),
  SidePanelPages: { ViewRecord: 'view-record' },
}));

import { SupportInbox } from '../../components/support-inbox';
import { ConversationRecord } from '../../components/conversation-record';

let root: Root;
let container: HTMLDivElement;
const conversation = {
  id: 'conversation-1',
  visitorName: 'Test customer',
  visitorEmail: 'pic@example.com',
  status: 'RESOLVED',
  appName: 'MIDA',
  shopDomain: 'shop.myshopify.com',
  lastMessageAt: '2026-10-14T01:00:00Z',
  lastMessageExcerpt: 'Test message',
  lastMessageFrom: 'USER',
  waitingSince: null,
  startedAt: '2026-10-14T01:00:00Z',
  messageCount: 1,
  segments: [],
  operatorName: null,
  country: null,
  sessionId: null,
  websiteId: null,
  sessionData: null,
  aiSummary: null,
  aiProblem: null,
  aiNextStep: null,
  aiSummaryAt: null,
  aiSummaryMessageCount: null,
  merchant: { id: 'merchant-1', name: 'shop.myshopify.com' },
};

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  Object.assign(context, {
    locationHash: '',
    locationPathname: '/page/inbox-page',
    isMobile: false,
  });
  navigate.mockClear();
  metadata.mockReset().mockResolvedValue({
    getPageLayouts: [
      {
        id: 'inbox-page',
        universalIdentifier: 'b996993c-8898-41b1-adaf-927c6e470f5a',
      },
    ],
  });
  post
    .mockReset()
    .mockImplementation(
      async (path: string, body: { conversationId?: string }) => {
        if (path.endsWith('/inbox/conversations')) {
          return {
            success: true,
            conversations: [],
            endCursor: null,
            hasNextPage: false,
            counts: { waiting: 0, open: 0, resolved: 1, all: 1 },
            appNames: ['MIDA'],
            sync: { lastSyncedAt: null, lastError: null, isConfigured: false },
          };
        }
        if (path.endsWith('/inbox/messages')) {
          return {
            success: true,
            conversation: { ...conversation, id: body.conversationId },
            messages: [
              {
                id: 'message-1',
                text: `Message for ${body.conversationId}`,
                sender: 'USER',
                senderName: 'Test customer',
                messageType: 'text',
                sentAt: '2026-10-14T01:00:00Z',
                content: null,
              },
            ],
            hasOlder: false,
            issues: [],
          };
        }
        throw new Error('Unexpected route');
      },
    );
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('full conversation navigation', () => {
  it('keeps the selected inbox filter when selecting a conversation updates the URL', async () => {
    const user = userEvent.setup();
    const implementation = post.getMockImplementation()!;
    post.mockImplementation(
      async (path: string, body: { conversationId?: string }) => {
        const result = await implementation(path, body);
        return path.endsWith('/inbox/conversations')
          ? { ...result, conversations: [conversation] }
          : result;
      },
    );
    await act(async () => root.render(createElement(SupportInbox)));
    await act(async () =>
      user.click(getByRole(container, 'tab', { name: /Resolved/ })),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: /Test customer/ })),
    );
    context.locationHash = 'conversation-conversation-1';
    await act(async () => root.render(createElement(SupportInbox)));
    expect(
      getByRole(container, 'tab', { name: /Resolved/ }).getAttribute(
        'aria-selected',
      ),
    ).toBe('true');
  });

  it('opens a linked thread and customer details even when the conversation is outside the visible list', async () => {
    context.locationHash = '#conversation-conversation-1';
    await act(async () => root.render(createElement(SupportInbox)));
    expect(getByText(container, 'Message for conversation-1')).toBeDefined();
    expect(
      getByRole(container, 'complementary', { name: 'Customer details' }),
    ).toBeDefined();
  });

  it('opens a different conversation when the host URL fragment changes', async () => {
    context.locationHash = 'conversation-conversation-1';
    await act(async () => root.render(createElement(SupportInbox)));
    context.locationHash = 'conversation-conversation-2';
    await act(async () => root.render(createElement(SupportInbox)));
    expect(getByText(container, 'Message for conversation-2')).toBeDefined();
    expect(container.textContent).not.toContain('Message for conversation-1');
  });

  it('keeps the record preview when its route matches the conversation record', async () => {
    context.locationPathname = '/object/crispConversation/conversation-1';
    await act(async () => root.render(createElement(ConversationRecord)));
    expect(navigate).not.toHaveBeenCalled();
    expect(getByText(container, 'Message for conversation-1')).toBeDefined();
  });

  it('keeps the side panel preview and offers an explicit action to open the full inbox', async () => {
    const user = userEvent.setup();
    context.locationPathname = '/object/crispConversation/conversation-1';
    await act(async () => root.render(createElement(ConversationRecord)));
    expect(navigate).not.toHaveBeenCalled();
    expect(getByText(container, 'Message for conversation-1')).toBeDefined();
    const fullConversationButton = getByRole(container, 'button', {
      name: 'Open full conversation',
    });
    expect(fullConversationButton.closest('header')).toBe(
      getByRole(container, 'button', { name: 'Show details' }).closest(
        'header',
      ),
    );
    expect(fullConversationButton.textContent).toBe('');
    await act(async () => user.click(fullConversationButton));
    expect(navigate).toHaveBeenCalledWith(
      '/page/inbox-page#conversation-conversation-1',
      undefined,
      undefined,
      { surface: 'main' },
    );
  });
});

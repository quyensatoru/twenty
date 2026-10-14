// @vitest-environment jsdom
import {
  getByRole,
  getByText,
  queryByRole,
  queryByText,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post, request, navigate, metadata } = vi.hoisted(() => ({
  post: vi.fn(),
  request: vi.fn(),
  navigate: vi.fn().mockResolvedValue(undefined),
  metadata: vi.fn(),
}));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
    request = request;
  },
}));
vi.mock('twenty-client-sdk/metadata', () => ({
  MetadataApiClient: class {
    query = metadata;
  },
}));
vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string) => text,
  navigate,
  enqueueSnackbar: vi.fn(),
  copyToClipboard: vi.fn(),
  useLocale: () => 'en',
  AppPath: { RecordShowPage: '/object/:objectNameSingular/:objectRecordId' },
}));
vi.mock('../../components/merchant-custom-settings-panel', () => ({
  MerchantCustomSettingsPanel: ({ merchantId }: { merchantId: string }) =>
    createElement('div', null, `Settings for ${merchantId}`),
}));
import { IssueRecordPreview } from '../../components/issue-record-preview';

const MERCHANT_FIELDS = [
  { name: 'contactName', label: 'Contact name', type: 'TEXT', isSystem: false },
  { name: 'email', label: 'Email', type: 'EMAILS', isSystem: false },
  {
    name: 'installedAt',
    label: 'Installed at',
    type: 'DATE_TIME',
    isSystem: false,
  },
  {
    name: 'uninstalledAt',
    label: 'Uninstalled at',
    type: 'DATE_TIME',
    isSystem: false,
  },
  {
    name: 'shopifyPlan',
    label: 'Shopify plan',
    type: 'SELECT',
    isSystem: false,
    options: [{ value: 'PLUS', label: 'Shopify Plus', color: 'purple' }],
  },
  {
    name: 'app',
    label: 'App',
    type: 'RELATION',
    isSystem: false,
    relation: {
      type: 'MANY_TO_ONE',
      targetFieldMetadata: { name: 'merchants' },
      targetObjectMetadata: {
        nameSingular: 'app',
        namePlural: 'apps',
        labelIdentifierFieldMetadataId: 'app-name-field',
      },
    },
  },
  {
    name: 'emailSends',
    label: 'Email sends',
    type: 'RELATION',
    isSystem: false,
    relation: {
      type: 'ONE_TO_MANY',
      targetFieldMetadata: { name: 'merchant' },
      targetObjectMetadata: {
        nameSingular: 'emailSend',
        namePlural: 'emailSends',
      },
    },
  },
  {
    name: 'createdAt',
    label: 'Creation date',
    type: 'DATE_TIME',
    isSystem: true,
  },
  {
    name: 'searchVector',
    label: 'Search vector',
    type: 'TS_VECTOR',
    isSystem: true,
  },
];

let container: HTMLDivElement;
let root: Root;
const back = vi.fn();
const select = vi.fn();
const full = vi.fn();
const openIssue = vi.fn();
const conversation = {
  id: 'chat-1',
  visitorName: 'Test visitor',
  visitorEmail: 'pic@example.com',
  status: 'RESOLVED',
  appName: 'Demo',
  shopDomain: 'test-merchant.myshopify.com',
  lastMessageAt: '2026-10-14T00:00:00Z',
  lastMessageExcerpt: 'Latest reply',
  lastMessageFrom: 'OPERATOR',
  waitingSince: null,
  startedAt: '2026-10-13T00:00:00Z',
  messageCount: 2,
  segments: ['vip'],
  operatorName: 'Agent',
  country: 'VN',
  sessionId: 'session-1',
  websiteId: 'website-1',
  sessionData: null,
  aiSummary: null,
  aiProblem: null,
  aiNextStep: null,
  aiSummaryAt: null,
  aiSummaryMessageCount: null,
  merchant: { id: 'merchant-1', name: 'Test merchant' },
};
const renderPreview = (
  objectNameSingular: 'merchant' | 'crispConversation' = 'crispConversation',
  recordId = 'chat-1',
) =>
  act(async () =>
    root.render(
      createElement(IssueRecordPreview, {
        issueId: 'issue-1',
        target: { objectNameSingular, recordId },
        merchants: [{ id: 'merchant-1', name: 'Test merchant' }],
        onBack: back,
        onSelect: select,
        onOpenIssue: openIssue,
        onOpenFull: full,
      }),
    ),
  );

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  metadata.mockImplementation(async (query: Record<string, unknown>) =>
    'fields' in query
      ? {
          fields: {
            edges: [{ node: { id: 'app-name-field', name: 'name' } }],
          },
        }
      : 'objects' in query
        ? {
            objects: {
              edges: [
                {
                  node: {
                    id: 'merchant-object',
                    fields: {
                      edges: MERCHANT_FIELDS.map((node) => ({ node })),
                    },
                  },
                },
              ],
            },
          }
        : {
            getPageLayouts: [
              {
                id: 'inbox-page',
                universalIdentifier: 'b996993c-8898-41b1-adaf-927c6e470f5a',
              },
            ],
          },
  );
  request.mockImplementation(async (_method: string, path: string) => {
    if (path === '/rest/merchants/merchant-1')
      return {
        data: {
          merchant: {
            id: 'merchant-1',
            name: 'test-merchant.myshopify.com',
            contactName: 'Jane Merchant',
            email: { primaryEmail: 'owner@example.com', additionalEmails: [] },
            installedAt: '2026-09-01T00:00:00Z',
            uninstalledAt: null,
            shopifyPlan: 'PLUS',
            appId: 'app-1',
            createdAt: '2026-08-01T00:00:00Z',
          },
        },
      };
    if (path === '/rest/apps/app-1')
      return { data: { app: { id: 'app-1', name: 'Demo' } } };
    if (path === '/rest/emailSends') return { totalCount: 3 };
    throw new Error(`Unexpected REST call ${path}`);
  });
  post.mockImplementation(async (path: string, body: { before?: string }) => {
    if (
      path.endsWith('/issue-conversations') ||
      path.endsWith('/merchant-conversations')
    )
      return { success: true, conversations: [conversation] };
    if (path.endsWith('/merchant-preview'))
      return {
        success: true,
        issues: [
          {
            id: 'issue-2',
            issueKey: 'DEMO-2',
            title: 'Checkout bug',
            statusName: 'Todo',
            statusColor: 'blue',
          },
        ],
      };
    if (path.endsWith('/inbox/messages'))
      return {
        success: true,
        conversation,
        hasOlder: !body.before,
        messages: [
          {
            id: body.before ? 'older' : 'latest',
            text: body.before ? 'Earlier question' : 'Latest reply',
            sender: 'OPERATOR',
            senderName: 'Agent',
            sentAt: body.before
              ? '2026-10-13T00:00:00Z'
              : '2026-10-14T00:00:00Z',
            messageType: 'text',
            content: null,
          },
        ],
      };
    throw new Error('Unexpected route');
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

describe('issue record preview', () => {
  it('reads chat in place, loads earlier messages, and opens full Inbox only on request', async () => {
    const user = userEvent.setup();
    await renderPreview();
    expect(
      getByRole(container, 'log', { name: 'Conversation messages' })
        .textContent,
    ).toContain('Latest reply');
    expect(navigate).not.toHaveBeenCalled();
    await act(async () =>
      user.click(
        getByRole(container, 'button', { name: 'Load earlier messages' }),
      ),
    );
    expect(getByText(container, 'Earlier question')).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Show details' })),
    );
    expect(getByText(container, 'vip')).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Open merchant' })),
    );
    expect(select).toHaveBeenCalledWith({
      objectNameSingular: 'merchant',
      recordId: 'merchant-1',
      label: 'Test merchant',
    });
    await act(async () =>
      user.click(
        getByRole(container, 'button', { name: 'Open full conversation' }),
      ),
    );
    expect(navigate).toHaveBeenCalledWith(
      '/page/inbox-page#conversation-chat-1',
      undefined,
      undefined,
      { surface: 'main' },
    );
    expect(full).toHaveBeenCalledTimes(1);
  });
  it('shows the merchant profile, its chats and issues, and returns to Details without navigating', async () => {
    const user = userEvent.setup();
    await renderPreview('merchant', 'merchant-1');
    expect(getByText(container, 'test-merchant')).toBeDefined();
    expect(getByText(container, 'Jane Merchant')).toBeDefined();
    expect(getByText(container, 'owner@example.com')).toBeDefined();
    expect(getByText(container, 'Shopify Plus')).toBeDefined();
    expect(getByText(container, 'Email sends')).toBeDefined();
    expect(getByText(container, '3')).toBeDefined();
    expect(queryByText(container, 'Uninstalled at')).toBeNull();
    await act(async () =>
      user.click(
        getByRole(container, 'button', { name: 'Show {count} empty fields' }),
      ),
    );
    expect(getByText(container, 'Uninstalled at')).toBeDefined();
    expect(getByText(container, 'Settings for merchant-1')).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: /Test visitor/ })),
    );
    expect(select).toHaveBeenCalledWith({
      objectNameSingular: 'crispConversation',
      recordId: 'chat-1',
      label: 'Conversation: Test visitor',
    });
    await act(async () =>
      user.click(getByRole(container, 'button', { name: /Checkout bug/ })),
    );
    expect(openIssue).toHaveBeenCalledWith('issue-2');
    expect(
      queryByRole(container, 'button', { name: 'Open full conversation' }),
    ).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Back to details' })),
    );
    expect(back).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });
});

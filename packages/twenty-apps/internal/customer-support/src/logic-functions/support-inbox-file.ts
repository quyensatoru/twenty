import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SUPPORT_INBOX_FILE_ROUTE_PATH } from '../constants/crisp';
import { SUPPORT_INBOX_FILE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';

type StoredFile = { fileId?: string | null; url?: string | null };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const textResponse = (body: string, status: number) => ({
  __twentyHttpResponse: true as const,
  body,
  headers: { 'content-type': 'text/plain; charset=utf-8' },
  status,
});

// Routes cannot send a Location header, so the page forwards the browser to a
// freshly signed file URL; signed URLs expire, this link does not.
const redirectResponse = (url: string) => {
  const safeUrl = escapeHtml(url);

  return {
    __twentyHttpResponse: true as const,
    body: `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${safeUrl}"><title>File</title></head><body><a href="${safeUrl}">Download the file</a><script>location.replace(${JSON.stringify(url)})</script></body></html>`,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
    status: 200,
  };
};

// Public on purpose: customers open it from Crisp without a CRM login. It is
// gated by the pair of random ids in the link and serves only that one file.
const handler = async (event: RoutePayload) => {
  const messageId = event.queryStringParameters?.m ?? '';
  const fileId = event.queryStringParameters?.f ?? '';

  if (!UUID_PATTERN.test(messageId) || !UUID_PATTERN.test(fileId)) {
    return textResponse('Not found', 404);
  }

  const result = await createAppClient().query({
    crispMessages: {
      __args: { filter: { id: { eq: messageId } }, first: 1 },
      edges: { node: { id: true, files: { fileId: true, url: true } } },
    },
  });
  const files = (result?.crispMessages?.edges?.[0]?.node?.files ??
    []) as StoredFile[];
  const url = files.find((file) => file.fileId === fileId)?.url;

  if (typeof url !== 'string' || url.length === 0) {
    return textResponse('This file is no longer available.', 404);
  }

  return redirectResponse(url);
};

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_FILE_LOGIC_FUNCTION_UID,
  name: 'support-inbox-file',
  description:
    'Public route: forwards a customer to a file the support team sent from the inbox.',
  timeoutSeconds: 15,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_FILE_ROUTE_PATH,
    httpMethod: 'GET',
    isAuthRequired: false,
  },
  handler,
});

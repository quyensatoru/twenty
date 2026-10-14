import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { SUPPORT_INBOX_PAGE_LAYOUT_UID } from '../../constants/universal-identifiers';

export const resolveSupportInboxPath = async (): Promise<string> => {
  const { getPageLayouts } = await new MetadataApiClient().query({
    getPageLayouts: { id: true, universalIdentifier: true },
  });
  const pageLayout = getPageLayouts.find(
    (pageLayout) =>
      pageLayout.universalIdentifier === SUPPORT_INBOX_PAGE_LAYOUT_UID,
  );

  if (pageLayout === undefined) {
    throw new Error('Support inbox is not available.');
  }

  return `/page/${pageLayout.id}`;
};

export const buildSupportInboxConversationPath = (
  inboxPath: string,
  conversationId: string,
): string => `${inboxPath}#conversation-${encodeURIComponent(conversationId)}`;

export const parseConversationAnchor = (
  locationHash: string,
): string | null => {
  const fragment = locationHash.replace(/^#/, '');

  if (!fragment.startsWith('conversation-')) {
    return null;
  }

  const encodedId = fragment.slice('conversation-'.length);

  try {
    return encodedId === '' ? null : decodeURIComponent(encodedId);
  } catch {
    return null;
  }
};

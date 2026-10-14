import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';

// The route's caller may not read Customer Support objects; this projection
// runs with the BD application's explicit read permission on conversations.
const getConversationAppClientOptions = () => {
  const token = process.env.TWENTY_APP_APPLICATION_ACCESS_TOKEN;

  if (!token) {
    throw new Error('Missing application access token.');
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const createConversationAppClient = () =>
  new CoreApiClient(getConversationAppClientOptions());

export const createConversationAppMetadataClient = () =>
  new MetadataApiClient(getConversationAppClientOptions());

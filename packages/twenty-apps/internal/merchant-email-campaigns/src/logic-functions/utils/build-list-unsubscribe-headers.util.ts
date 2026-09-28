// RFC 8058 one-click unsubscribe. Gmail and Yahoo require it for bulk senders
// since 2024 and show their own "Unsubscribe" button next to the sender.
export const buildListUnsubscribeHeaders = (
  unsubscribeUrl: string,
): Record<string, string> => ({
  'List-Unsubscribe': `<${unsubscribeUrl}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
});

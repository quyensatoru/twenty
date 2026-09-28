import { createHmac } from 'node:crypto';

export const signUnsubscribeToken = (
  merchantId: string,
  secret: string,
): string => {
  const signature = createHmac('sha256', secret)
    .update(`unsubscribe:${merchantId}`)
    .digest('base64url')
    .slice(0, 32);

  return `${Buffer.from(merchantId).toString('base64url')}.${signature}`;
};

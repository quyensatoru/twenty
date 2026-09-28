import { UNSUBSCRIBE_ROUTE_PATH } from '../../constants/route-paths';
import { buildPublicRouteUrl } from './build-public-route-url.util';
import { readUnsubscribeSecret } from './read-unsubscribe-secret.util';
import { signUnsubscribeToken } from './sign-unsubscribe-token.util';

export const buildUnsubscribeUrl = (merchantId: string): string => {
  const token = signUnsubscribeToken(merchantId, readUnsubscribeSecret());

  return `${buildPublicRouteUrl(UNSUBSCRIBE_ROUTE_PATH)}?token=${encodeURIComponent(token)}`;
};

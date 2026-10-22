import { UNSUBSCRIBE_ROUTE_PATH } from '../../constants/route-paths';
import { buildPublicRouteUrl } from './build-public-route-url.util';
import { readUnsubscribeSecret } from './read-unsubscribe-secret.util';
import { signUnsubscribeToken } from './sign-unsubscribe-token.util';

// For a manual-list recipient with no merchant row: the `email:` prefix is
// what unsubscribe-one-click.ts uses to tell this apart from a merchant
// token, both signed by the same function with the same secret.
export const buildEmailUnsubscribeUrl = (email: string): string => {
  const token = signUnsubscribeToken(`email:${email}`, readUnsubscribeSecret());

  return `${buildPublicRouteUrl(UNSUBSCRIBE_ROUTE_PATH)}?token=${encodeURIComponent(token)}`;
};

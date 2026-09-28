import { PUBLIC_SERVER_URL_VARIABLE } from '../../constants/application-variable-names';

export const buildPublicRouteUrl = (routePath: string): string => {
  const baseUrl = (
    process.env[PUBLIC_SERVER_URL_VARIABLE]?.trim() ||
    process.env.TWENTY_API_URL ||
    ''
  ).replace(/\/+$/, '');

  return `${baseUrl}/s${routePath}`;
};

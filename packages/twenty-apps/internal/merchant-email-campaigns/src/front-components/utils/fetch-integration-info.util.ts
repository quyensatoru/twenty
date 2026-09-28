import { INTEGRATION_INFO_ROUTE_PATH } from '../../constants/route-paths';
import { type IntegrationInfo } from '../../types/integration-info';
import { postAppRoute } from './post-app-route.util';

export const fetchIntegrationInfo = (): Promise<IntegrationInfo> =>
  postAppRoute<{ success: boolean } & IntegrationInfo>(
    INTEGRATION_INFO_ROUTE_PATH,
    {},
  );

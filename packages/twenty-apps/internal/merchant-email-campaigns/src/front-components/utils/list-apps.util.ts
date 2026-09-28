import { LIST_APPS_ROUTE_PATH } from '../../constants/route-paths';
import { postAppRoute } from './post-app-route.util';

export const listApps = async (): Promise<{ id: string; name: string }[]> => {
  const { apps } = await postAppRoute<{
    success: boolean;
    apps: { id: string; name: string }[];
  }>(LIST_APPS_ROUTE_PATH, {});

  return apps;
};

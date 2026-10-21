import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { PUBLIC_BASE_URL_VARIABLE } from '../../constants/application-variable-names';
import { HEALTH_DASHBOARD_PAGE_LAYOUT_UID } from '../../constants/universal-identifiers';

type PageLayoutNode = {
  id?: string | null;
  universalIdentifier?: string | null;
};

// The host routes page layouts by their workspace id, which only exists after
// install. Null when the lookup fails.
export const findDashboardPageLayoutId = async (): Promise<string | null> => {
  try {
    const client = new MetadataApiClient({
      runAs: 'application',
    }) as unknown as {
      query: (
        selection: Record<string, unknown>,
      ) => Promise<{ getPageLayouts?: PageLayoutNode[] | null }>;
    };
    const { getPageLayouts } = await client.query({
      getPageLayouts: {
        __args: { pageLayoutType: 'STANDALONE_PAGE' },
        id: true,
        universalIdentifier: true,
      },
    });

    return (
      getPageLayouts?.find(
        (layout) =>
          layout.universalIdentifier === HEALTH_DASHBOARD_PAGE_LAYOUT_UID,
      )?.id ?? null
    );
  } catch {
    return null;
  }
};

export const findDashboardUrl = async (): Promise<string | null> => {
  const baseUrl = (process.env[PUBLIC_BASE_URL_VARIABLE] ?? '')
    .trim()
    .replace(/\/+$/, '');

  if (baseUrl.length === 0) {
    return null;
  }

  const pageLayoutId = await findDashboardPageLayoutId();

  return pageLayoutId === null ? null : `${baseUrl}/page/${pageLayoutId}`;
};

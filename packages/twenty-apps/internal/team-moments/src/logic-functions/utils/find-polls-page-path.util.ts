import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { POLLS_PAGE_LAYOUT_UID } from '../../constants/universal-identifiers';

type PageLayoutNode = { id?: string | null; universalIdentifier?: string | null };

type MetadataClient = {
  query: (selection: Record<string, unknown>) => Promise<{ getPageLayouts?: PageLayoutNode[] | null }>;
};

// Same lookup as find-moments-page-path.util.ts, targeting the Polls page:
// the host routes page layouts by their workspace id, which only exists
// after install.
export const findPollsPagePath = async (): Promise<string | null> => {
  try {
    const client = new MetadataApiClient({ runAs: 'application' }) as unknown as MetadataClient;
    const { getPageLayouts } = await client.query({
      getPageLayouts: {
        __args: { pageLayoutType: 'STANDALONE_PAGE' },
        id: true,
        universalIdentifier: true,
      },
    });
    const pageLayoutId = getPageLayouts?.find((layout) => layout.universalIdentifier === POLLS_PAGE_LAYOUT_UID)?.id;

    return pageLayoutId ? `/page/${pageLayoutId}` : null;
  } catch {
    return null;
  }
};

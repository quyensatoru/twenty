import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { MOMENTS_PAGE_LAYOUT_UID } from '../../constants/universal-identifiers';

type PageLayoutNode = { id?: string | null; universalIdentifier?: string | null };

type MetadataClient = {
  query: (selection: Record<string, unknown>) => Promise<{ getPageLayouts?: PageLayoutNode[] | null }>;
};

// The host routes page layouts by their workspace id, which only exists after
// install. Null when the lookup fails: the share page then omits the link.
export const findMomentsPagePath = async (): Promise<string | null> => {
  try {
    const client = new MetadataApiClient({ runAs: 'application' }) as unknown as MetadataClient;
    const { getPageLayouts } = await client.query({
      getPageLayouts: {
        __args: { pageLayoutType: 'STANDALONE_PAGE' },
        id: true,
        universalIdentifier: true,
      },
    });
    const pageLayoutId = getPageLayouts?.find((layout) => layout.universalIdentifier === MOMENTS_PAGE_LAYOUT_UID)?.id;

    return pageLayoutId ? `/page/${pageLayoutId}` : null;
  } catch {
    return null;
  }
};

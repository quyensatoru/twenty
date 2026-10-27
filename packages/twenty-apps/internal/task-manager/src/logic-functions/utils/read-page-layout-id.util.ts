import { MetadataApiClient } from 'twenty-client-sdk/metadata';

// A standalone page is addressed by its per-workspace id, so a page can only
// link to another one after looking it up. Null when it cannot: the link is a
// convenience, and the sidebar still reaches the page.
export const readPageLayoutId = async (
  universalIdentifier: string,
): Promise<string | null> => {
  try {
    const result = await new MetadataApiClient({ runAs: 'application' }).query({
      getPageLayouts: {
        __args: { pageLayoutType: 'STANDALONE_PAGE' },
        id: true,
        universalIdentifier: true,
      },
    });
    const pageLayouts = (result?.getPageLayouts ?? []) as {
      id?: string | null;
      universalIdentifier?: string | null;
    }[];
    const pageLayoutId = pageLayouts.find(
      (pageLayout) => pageLayout.universalIdentifier === universalIdentifier,
    )?.id;

    return typeof pageLayoutId === 'string' ? pageLayoutId : null;
  } catch {
    return null;
  }
};

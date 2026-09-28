import { MetadataApiClient } from 'twenty-client-sdk/metadata';

type PageLayoutRow = { id: string; universalIdentifier: string };

// AppPath.PageLayoutPage is '/page/:pageLayoutId' and wants the workspace row
// id, which an app only knows as a universalIdentifier — so the id is looked up
// once at mount. Reading page layouts can be denied for a member, hence the
// null return: the caller hides the shortcut rather than rendering a dead one.
export const resolvePageLayoutId = async (
  universalIdentifier: string,
): Promise<string | null> => {
  try {
    const { getPageLayouts } = (await new MetadataApiClient().query({
      getPageLayouts: { id: true, universalIdentifier: true },
    })) as { getPageLayouts?: PageLayoutRow[] };

    return (
      getPageLayouts?.find(
        (pageLayout) => pageLayout.universalIdentifier === universalIdentifier,
      )?.id ?? null
    );
  } catch {
    return null;
  }
};

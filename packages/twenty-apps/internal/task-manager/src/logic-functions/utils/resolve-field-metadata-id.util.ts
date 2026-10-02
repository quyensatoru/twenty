import { MetadataApiClient } from 'twenty-client-sdk/metadata';

type MetadataFieldNode = {
  id?: string | null;
  type?: string | null;
  universalIdentifier?: string | null;
};

// A fieldMetadataId is per-workspace, so it cannot be baked into the bundle —
// only the universalIdentifier can. Resolved against the APPLICATION's token:
// a viewer stripped of metadata reads must still be able to upload.
export const resolveFieldMetadataId = async ({
  objectUniversalIdentifier,
  fieldUniversalIdentifier,
  fieldType,
}: {
  objectUniversalIdentifier: string;
  fieldUniversalIdentifier: string;
  fieldType: string;
}): Promise<string | null> => {
  const metadataClient = new MetadataApiClient({ runAs: 'application' });

  const result = await metadataClient.query({
    objects: {
      __args: {
        paging: { first: 1 },
        filter: { universalIdentifier: { eq: objectUniversalIdentifier } },
      },
      edges: {
        node: {
          id: true,
          fields: {
            __args: { paging: { first: 200 }, filter: {} },
            edges: {
              node: { id: true, type: true, universalIdentifier: true },
            },
          },
        },
      },
    },
  });

  const fieldEdges =
    result?.objects?.edges?.[0]?.node?.fields?.edges ??
    ([] as { node?: MetadataFieldNode }[]);

  const field = fieldEdges
    .map((edge) => edge?.node as MetadataFieldNode | undefined)
    .find(
      (candidate) =>
        candidate?.universalIdentifier === fieldUniversalIdentifier &&
        candidate?.type === fieldType,
    );

  return field?.id ?? null;
};

import { MetadataApiClient } from 'twenty-client-sdk/metadata';

type FieldNode = { id?: string | null; universalIdentifier?: string | null };

const resolvedFieldIds = new Map<string, string>();

// Uploads must name the workspace's fieldMetadataId, which only exists after
// install, so it is looked up from the stable universalIdentifier. A miss is
// not remembered: one flaky request must not disable uploads for good.
export const resolveFieldMetadataId = async ({
  objectUniversalIdentifier,
  fieldUniversalIdentifier,
}: {
  objectUniversalIdentifier: string;
  fieldUniversalIdentifier: string;
}): Promise<string | null> => {
  const cached = resolvedFieldIds.get(fieldUniversalIdentifier);

  if (cached !== undefined) {
    return cached;
  }

  try {
    const result = (await new MetadataApiClient().query({
      objects: {
        __args: { paging: { first: 1 }, filter: { universalIdentifier: { eq: objectUniversalIdentifier } } },
        edges: {
          node: {
            id: true,
            fields: {
              __args: { paging: { first: 100 }, filter: {} },
              edges: { node: { id: true, universalIdentifier: true } },
            },
          },
        },
      },
    })) as { objects?: { edges?: { node?: { fields?: { edges?: { node?: FieldNode }[] } } }[] } };

    const fieldId = (result.objects?.edges?.[0]?.node?.fields?.edges ?? [])
      .map((edge) => edge.node)
      .find((node) => node?.universalIdentifier === fieldUniversalIdentifier)?.id;

    if (typeof fieldId === 'string') {
      resolvedFieldIds.set(fieldUniversalIdentifier, fieldId);

      return fieldId;
    }
  } catch {
    return null;
  }

  return null;
};

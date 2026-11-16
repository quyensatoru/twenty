import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { MERCHANT_OBJECT_UID } from '../../constants/universal-identifiers';
import { type ApiClient } from '../../types/api-client';
import { MERCHANT_SELECTION } from './record-selections';

// pricingPlan, using and storeName are custom fields the product syncs create
// on production; no app declares them, so other workspaces may lack them and
// a query naming a missing field fails outright.
const OPTIONAL_MERCHANT_FIELDS = ['pricingPlan', 'using', 'storeName'] as const;

export type OptionalMerchantField = (typeof OPTIONAL_MERCHANT_FIELDS)[number];

const CACHE_MS = 10 * 60 * 1000;

let cached: { fields: Set<OptionalMerchantField>; at: number } | null = null;

type MerchantFieldsResult = {
  objects?: {
    edges?: {
      node?: { fields?: { edges?: { node?: { name?: string } }[] } };
    }[];
  };
};

const readMerchantFieldNames = async (): Promise<Set<string> | null> => {
  try {
    const result = (await new MetadataApiClient().query({
      objects: {
        __args: {
          paging: { first: 1 },
          filter: { universalIdentifier: { eq: MERCHANT_OBJECT_UID } },
        },
        edges: {
          node: {
            fields: {
              __args: { paging: { first: 500 }, filter: {} },
              edges: { node: { name: true } },
            },
          },
        },
      },
    })) as MerchantFieldsResult;
    const names = (result.objects?.edges?.[0]?.node?.fields?.edges ?? []).flatMap(
      (edge) => (typeof edge.node?.name === 'string' ? [edge.node.name] : []),
    );

    return names.length > 0 ? new Set(names) : null;
  } catch {
    return null;
  }
};

// Fallback when metadata cannot be read: the data API rejects a query naming
// a missing field.
const probeField = async (
  client: ApiClient,
  field: OptionalMerchantField,
): Promise<boolean> => {
  try {
    await client.query({
      merchants: {
        __args: { first: 1 },
        edges: { node: { id: true, [field]: true } },
      },
    });

    return true;
  } catch {
    return false;
  }
};

export const readOptionalMerchantFields = async (
  client: ApiClient,
): Promise<Set<OptionalMerchantField>> => {
  if (cached !== null && Date.now() - cached.at < CACHE_MS) {
    return cached.fields;
  }

  const fieldNames = await readMerchantFieldNames();
  const present = await Promise.all(
    OPTIONAL_MERCHANT_FIELDS.map(async (field) => {
      const isPresent =
        fieldNames === null
          ? await probeField(client, field)
          : fieldNames.has(field);

      return isPresent ? field : null;
    }),
  );
  const fields = new Set(
    present.filter((field): field is OptionalMerchantField => field !== null),
  );

  cached = { fields, at: Date.now() };

  return fields;
};

export const resolveMerchantSelection = async (
  client: ApiClient,
): Promise<Record<string, unknown>> => {
  const fields = await readOptionalMerchantFields(client);
  const selection: Record<string, unknown> = { ...MERCHANT_SELECTION };

  for (const field of OPTIONAL_MERCHANT_FIELDS) {
    if (!fields.has(field)) {
      delete selection[field];
    }
  }

  return selection;
};

export const normalizeMerchant = <TMerchant extends Record<string, unknown>>(
  merchant: TMerchant,
): TMerchant => ({
  ...merchant,
  pricingPlan: merchant.pricingPlan ?? null,
  using: merchant.using ?? null,
  storeName: merchant.storeName ?? null,
});

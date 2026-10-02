import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type CustomSettingValues } from '../../types/custom-setting-schema';

type MerchantCustomSettingsRow = {
  appId: string | null;
  customSettings: CustomSettingValues;
  fieldSchema: unknown;
};

const readValues = (value: unknown): CustomSettingValues =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as CustomSettingValues)
    : {};

// One round trip for both sides of the form: the values on the merchant and
// the schema on the app behind it. fetchRecordColumn cannot stand in — it
// reads a single string column, and customSettings is raw JSON.
export const readMerchantCustomSettings = async ({
  client,
  merchantId,
}: {
  client: ApiClient;
  merchantId: string;
}): Promise<MerchantCustomSettingsRow> => {
  const result = await client.query({
    merchants: {
      __args: { filter: { id: { eq: merchantId } }, first: 1 },
      edges: {
        node: {
          id: true,
          appId: true,
          customSettings: true,
          app: { id: true, fieldSchema: true },
        },
      },
    },
  });

  const node = (
    result?.merchants as Connection<Record<string, unknown>> | undefined
  )?.edges?.[0]?.node;

  const app = node?.app as { fieldSchema?: unknown } | null | undefined;

  return {
    appId: typeof node?.appId === 'string' ? node.appId : null,
    customSettings: readValues(node?.customSettings),
    fieldSchema: app?.fieldSchema ?? null,
  };
};

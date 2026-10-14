import { useEffect, useState } from 'react';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { MERCHANT_OBJECT_UID } from '../../constants/universal-identifiers';
import { readErrorText } from '../utils/read-error-text.util';

export type MerchantFieldOption = {
  value: string;
  label: string;
  color?: string | null;
};

export type MerchantRecordField = {
  name: string;
  label: string;
  type: string;
  value: unknown;
  options: MerchantFieldOption[];
  isSystem: boolean;
  // MANY_TO_ONE: the related record's label. ONE_TO_MANY: how many records.
  relatedLabel?: string | null;
  relatedCount?: number | null;
};

type MetadataField = {
  name: string;
  label: string;
  type: string;
  isSystem?: boolean | null;
  isActive?: boolean | null;
  options?: unknown;
  relation?: {
    type: 'MANY_TO_ONE' | 'ONE_TO_MANY';
    targetFieldMetadata?: { name: string } | null;
    targetObjectMetadata?: {
      namePlural: string;
      nameSingular: string;
      labelIdentifierFieldMetadataId?: string | null;
    } | null;
  } | null;
  // Filled after the first read: the API caps how deep one query may nest.
  targetLabelFieldName?: string;
};

// Drawn as their own sections of the preview, or plumbing nobody reads.
const HIDDEN_FIELD_NAMES = new Set([
  'id',
  'name',
  'position',
  'searchVector',
  'deletedAt',
  'customSettings',
  'customSettingFiles',
  'crispConversations',
  'issues',
  'timelineActivities',
  'taskTargets',
  'noteTargets',
  'attachments',
  'agentChatThreadTargets',
]);

const VISIBLE_SYSTEM_FIELD_NAMES = new Set([
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
]);

const readOptions = (options: unknown): MerchantFieldOption[] =>
  Array.isArray(options)
    ? options.filter(
        (option): option is MerchantFieldOption =>
          typeof option?.value === 'string' &&
          typeof option?.label === 'string',
      )
    : [];

const readMerchantFields = async (): Promise<MetadataField[]> => {
  const result = await new MetadataApiClient().query({
    objects: {
      __args: {
        paging: { first: 1 },
        filter: { universalIdentifier: { eq: MERCHANT_OBJECT_UID } },
      },
      edges: {
        node: {
          id: true,
          fields: {
            __args: { paging: { first: 200 }, filter: {} },
            edges: {
              node: {
                name: true,
                label: true,
                type: true,
                isSystem: true,
                isActive: true,
                options: true,
                relation: {
                  type: true,
                  targetFieldMetadata: { name: true },
                  targetObjectMetadata: {
                    nameSingular: true,
                    namePlural: true,
                    labelIdentifierFieldMetadataId: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const edges = (result?.objects?.edges?.[0]?.node?.fields?.edges ?? []) as {
    node: MetadataField;
  }[];

  const fields = edges
    .map((edge) => edge.node)
    .filter(
      (field) =>
        field.isActive !== false &&
        !HIDDEN_FIELD_NAMES.has(field.name) &&
        (field.isSystem !== true || VISIBLE_SYSTEM_FIELD_NAMES.has(field.name)),
    );
  const labelFieldIds = [
    ...new Set(
      fields
        .filter((field) => field.relation?.type === 'MANY_TO_ONE')
        .map(
          (field) =>
            field.relation?.targetObjectMetadata
              ?.labelIdentifierFieldMetadataId,
        )
        .filter((id): id is string => typeof id === 'string'),
    ),
  ];

  if (labelFieldIds.length === 0) {
    return fields;
  }

  const labelResult = await new MetadataApiClient().query({
    fields: {
      __args: {
        paging: { first: labelFieldIds.length },
        filter: { id: { in: labelFieldIds } },
      },
      edges: { node: { id: true, name: true } },
    },
  });
  const labelFieldNamesById = new Map(
    (
      (labelResult?.fields?.edges ?? []) as {
        node: { id: string; name: string };
      }[]
    ).map((edge) => [edge.node.id, edge.node.name]),
  );

  return fields.map((field) => ({
    ...field,
    targetLabelFieldName: labelFieldNamesById.get(
      field.relation?.targetObjectMetadata?.labelIdentifierFieldMetadataId ??
        '',
    ),
  }));
};

const readRelatedLabel = async (
  client: RestApiClient,
  field: MetadataField,
  recordId: unknown,
): Promise<string | null> => {
  const target = field.relation?.targetObjectMetadata;

  if (typeof recordId !== 'string' || !target) {
    return null;
  }

  const response = (await client.request(
    'GET',
    `/rest/${target.namePlural}/${recordId}`,
    { query: { depth: 0 } },
  )) as { data?: Record<string, Record<string, unknown> | undefined> };
  const record = response?.data?.[target.nameSingular];
  const label =
    field.targetLabelFieldName === undefined
      ? null
      : record?.[field.targetLabelFieldName];

  return typeof label === 'string' && label.length > 0
    ? label
    : typeof record?.name === 'string' && record.name.length > 0
      ? record.name
      : recordId;
};

const readRelatedCount = async (
  client: RestApiClient,
  field: MetadataField,
  merchantId: string,
): Promise<number | null> => {
  const target = field.relation?.targetObjectMetadata;
  const joinFieldName = field.relation?.targetFieldMetadata?.name;

  if (!target || joinFieldName === undefined) {
    return null;
  }

  const response = (await client.request('GET', `/rest/${target.namePlural}`, {
    query: {
      filter: `${joinFieldName}Id[eq]:"${merchantId}"`,
      limit: 1,
    },
  })) as { totalCount?: number };

  return typeof response?.totalCount === 'number' ? response.totalCount : null;
};

type MerchantRecordFieldsState = {
  record: Record<string, unknown> | null;
  fields: MerchantRecordField[];
  isLoading: boolean;
  error: string | null;
};

// Read the way the record page reads it — the viewer's own REST access and
// the object's live metadata — so fields other apps or the workspace add to
// merchant show up here without this app declaring them.
export const useMerchantRecordFields = (merchantId: string) => {
  const [state, setState] = useState<MerchantRecordFieldsState>({
    record: null,
    fields: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCurrent = true;
    const client = new RestApiClient();

    setState({ record: null, fields: [], isLoading: true, error: null });

    const load = async () => {
      const [metadataFields, response] = await Promise.all([
        readMerchantFields(),
        client.request('GET', `/rest/merchants/${merchantId}`, {
          query: { depth: 0 },
        }) as Promise<{ data?: { merchant?: Record<string, unknown> } }>,
      ]);
      const record = response?.data?.merchant ?? null;

      if (record === null) {
        throw new Error('Merchant not found.');
      }

      // A relation whose target this app's role cannot read is left out
      // rather than shown as empty, which it may well not be.
      const fields = await Promise.all(
        metadataFields.map(
          async (field): Promise<MerchantRecordField | null> => {
            const base = {
              name: field.name,
              label: field.label,
              type: field.type,
              value: record[field.name],
              options: readOptions(field.options),
              isSystem: field.isSystem === true,
            };

            if (field.relation?.type === 'MANY_TO_ONE') {
              return readRelatedLabel(client, field, record[`${field.name}Id`])
                .then((relatedLabel) => ({ ...base, relatedLabel }))
                .catch(() => null);
            }

            if (field.relation?.type === 'ONE_TO_MANY') {
              return readRelatedCount(client, field, merchantId)
                .then((relatedCount) => ({ ...base, relatedCount }))
                .catch(() => null);
            }

            return base;
          },
        ),
      );

      return {
        record,
        fields: fields.filter(
          (field): field is MerchantRecordField => field !== null,
        ),
      };
    };

    load()
      .then(({ record, fields }) => {
        if (isCurrent) {
          setState({ record, fields, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setState({
            record: null,
            fields: [],
            isLoading: false,
            error: readErrorText(error),
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [merchantId]);

  return state;
};

import { type ApiClient } from '../../types/api-client';
import { normalizeEmptyStrings } from './normalize-record.util';

const capitalize = (value: string): string =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const createRecord = async <TRecord>({
  client,
  objectNameSingular,
  data,
  selection,
}: {
  client: ApiClient;
  objectNameSingular: string;
  data: Record<string, unknown>;
  selection: Record<string, unknown>;
}): Promise<TRecord> => {
  const mutationName = `create${capitalize(objectNameSingular)}`;
  const result = await client.mutation({
    [mutationName]: { __args: { data }, ...selection },
  });

  return normalizeEmptyStrings(result?.[mutationName] as TRecord);
};

export const updateRecord = async <TRecord>({
  client,
  objectNameSingular,
  id,
  data,
  selection = { id: true },
}: {
  client: ApiClient;
  objectNameSingular: string;
  id: string;
  data: Record<string, unknown>;
  selection?: Record<string, unknown>;
}): Promise<TRecord> => {
  const mutationName = `update${capitalize(objectNameSingular)}`;
  const result = await client.mutation({
    [mutationName]: { __args: { id, data }, ...selection },
  });

  return normalizeEmptyStrings(result?.[mutationName] as TRecord);
};

export const deleteRecord = async ({
  client,
  objectNameSingular,
  id,
}: {
  client: ApiClient;
  objectNameSingular: string;
  id: string;
}): Promise<void> => {
  await client.mutation({
    [`delete${capitalize(objectNameSingular)}`]: { __args: { id }, id: true },
  });
};

export const findFirstRecord = async <TRecord>({
  client,
  objectNamePlural,
  filter,
  selection,
  orderBy,
}: {
  client: ApiClient;
  objectNamePlural: string;
  filter: Record<string, unknown>;
  selection: Record<string, unknown>;
  orderBy?: unknown;
}): Promise<TRecord | null> => {
  const result = await client.query({
    [objectNamePlural]: {
      __args: {
        filter,
        first: 1,
        ...(orderBy === undefined ? {} : { orderBy }),
      },
      edges: { node: selection },
    },
  });

  const node = result?.[objectNamePlural]?.edges?.[0]?.node as TRecord | undefined;

  return node === undefined ? null : normalizeEmptyStrings(node);
};

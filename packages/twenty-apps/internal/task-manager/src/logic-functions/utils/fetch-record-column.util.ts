import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

const columnReadsByClient = new WeakMap<
  object,
  Map<string, Promise<string | null>>
>();

// A route resolves the same scope chain (issue -> project -> app) in its guard
// and again in its body; each hop is a sequential API round trip. Reads are
// shared for the life of one route client and dropped on its next mutation.
export const enableRecordColumnCache = (client: ApiClient): void => {
  const cache = new Map<string, Promise<string | null>>();
  const mutation = client.mutation.bind(client);

  columnReadsByClient.set(client, cache);
  client.mutation = (...args: unknown[]) => {
    cache.clear();

    return mutation(...args);
  };
};

const queryRecordColumn = async (
  client: ApiClient,
  pluralName: string,
  id: string,
  columnName: string,
): Promise<string | null> => {
  const result = await client.query({
    [pluralName]: {
      __args: { filter: { id: { eq: id } }, first: 1 },
      edges: { node: { id: true, [columnName]: true } },
    },
  });

  const connection = result?.[pluralName] as
    Connection<Record<string, unknown>> | undefined;
  const value = connection?.edges?.[0]?.node?.[columnName];

  return typeof value === 'string' ? value : null;
};

// Reads one column off one record without hydrating the whole row. Mirrors the
// fork's fetchColumnValue, which went straight to the query builder.
export const fetchRecordColumn = (
  client: ApiClient,
  pluralName: string,
  id: string,
  columnName: string,
): Promise<string | null> => {
  const cache = columnReadsByClient.get(client);

  if (cache === undefined) {
    return queryRecordColumn(client, pluralName, id, columnName);
  }

  const key = `${pluralName}:${id}:${columnName}`;
  const cached = cache.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const read = queryRecordColumn(client, pluralName, id, columnName);

  cache.set(key, read);
  read.catch(() => {
    if (cache.get(key) === read) cache.delete(key);
  });

  return read;
};

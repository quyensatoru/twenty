import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

// Reads one column off one record without hydrating the whole row. Mirrors the
// fork's fetchColumnValue, which went straight to the query builder.
export const fetchRecordColumn = async (
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
    | Connection<Record<string, unknown>>
    | undefined;
  const value = connection?.edges?.[0]?.node?.[columnName];

  return typeof value === 'string' ? value : null;
};

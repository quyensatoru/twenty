import { type ApiClient } from '../../types/api-client';

const PAGE_SIZE = 200;

export const listAllRecords = async <TNode>({
  client,
  pluralName,
  filter,
  selection,
  orderBy,
  maxRecords = 20_000,
}: {
  client: ApiClient;
  pluralName: string;
  filter?: Record<string, unknown>;
  selection: Record<string, unknown>;
  orderBy?: unknown;
  maxRecords?: number;
}): Promise<TNode[]> => {
  const nodes: TNode[] = [];
  let after: string | undefined;

  while (nodes.length < maxRecords) {
    const result = await client.query({
      [pluralName]: {
        __args: {
          ...(filter === undefined ? {} : { filter }),
          first: PAGE_SIZE,
          ...(orderBy === undefined ? {} : { orderBy }),
          ...(after === undefined ? {} : { after }),
        },
        edges: { cursor: true, node: selection },
      },
    });
    const edges = (result?.[pluralName]?.edges ?? []) as {
      cursor?: string;
      node: TNode;
    }[];

    nodes.push(...edges.map((edge) => edge.node));

    after = edges[edges.length - 1]?.cursor;

    if (edges.length < PAGE_SIZE || after === undefined) {
      break;
    }
  }

  return nodes.slice(0, maxRecords);
};

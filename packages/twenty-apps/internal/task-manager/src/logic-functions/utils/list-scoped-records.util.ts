import { type ApiClient } from '../../types/api-client';

const DEFAULT_PAGE_SIZE = 200;

// Pages a collection and returns every node. Filters are the caller's
// responsibility: the app-scope narrowing is always merged in by the route
// before calling this, never here, so a forgotten filter is a visible omission
// at the call site rather than a silent widening inside a helper.
export const listScopedRecords = async <TNode>({
  client,
  pluralName,
  filter,
  selection,
  orderBy,
  pageSize = DEFAULT_PAGE_SIZE,
  maxRecords = 2000,
}: {
  client: ApiClient;
  pluralName: string;
  filter: Record<string, unknown>;
  selection: Record<string, unknown>;
  orderBy?: unknown;
  pageSize?: number;
  maxRecords?: number;
}): Promise<TNode[]> => {
  const nodes: TNode[] = [];
  let after: string | undefined;

  while (nodes.length < maxRecords) {
    const result = await client.query({
      [pluralName]: {
        __args: {
          filter,
          first: pageSize,
          ...(orderBy === undefined ? {} : { orderBy }),
          ...(after === undefined ? {} : { after }),
        },
        edges: { cursor: true, node: selection },
      },
    });

    const connection = result?.[pluralName] as
      | { edges?: { cursor?: string; node: TNode }[] }
      | undefined;
    const edges = connection?.edges ?? [];

    for (const edge of edges) {
      nodes.push(edge.node);
    }

    if (edges.length < pageSize) {
      return nodes;
    }

    after = edges[edges.length - 1]?.cursor;

    if (after === undefined) {
      return nodes;
    }
  }

  return nodes;
};

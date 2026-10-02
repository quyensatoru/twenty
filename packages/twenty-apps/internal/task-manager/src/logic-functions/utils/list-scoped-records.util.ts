import { type ApiClient } from '../../types/api-client';

const DEFAULT_PAGE_SIZE = 200;

// A read that asks for no bound still cannot page forever. Past this the route
// is wrong about its own filter, and failing loudly beats a board that is
// quietly missing rows.
const UNBOUNDED_READ_CEILING = 20000;

// Pages a collection and returns every node. Filters are the caller's
// responsibility: the app-scope narrowing is always merged in by the route
// before calling this, never here, so a forgotten filter is a visible omission
// at the call site rather than a silent widening inside a helper.
//
// `maxRecords` is for a caller that WANTS a bounded slice (the search routes,
// which ask for one more than they display to know there is a next page). Left
// out, the read is exhaustive and throws rather than truncating.
export const listScopedRecords = async <TNode>({
  client,
  pluralName,
  filter,
  selection,
  orderBy,
  pageSize = DEFAULT_PAGE_SIZE,
  maxRecords,
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
  const recordLimit = maxRecords ?? UNBOUNDED_READ_CEILING;
  let after: string | undefined;

  while (nodes.length < recordLimit) {
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

  if (maxRecords === undefined) {
    throw new Error(
      `Refusing to truncate a ${pluralName} read: more than ${UNBOUNDED_READ_CEILING} records matched.`,
    );
  }

  return nodes;
};

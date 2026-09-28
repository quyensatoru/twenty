export type Connection<TNode> = {
  edges?: { node: TNode }[];
  pageInfo?: { hasNextPage?: boolean; endCursor?: string };
  totalCount?: number;
};

export type Connection<TNode> = {
  edges: { node: TNode }[];
  totalCount?: number;
};

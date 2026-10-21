export type NodeLabels = Record<string, string>;

const SEGMENT_NAMES: Record<string, string> = {
  api: 'API',
  hm: 'Heatmap',
  ping: 'Ping',
  proxy: 'Proxy',
  db: 'Database',
  ws: 'WebSocket',
};

const formatSegment = (segment: string): string => {
  const shard = /^shard(\d+)$/i.exec(segment);

  if (shard !== null) {
    return `Shard ${shard[1]}`;
  }

  const known = SEGMENT_NAMES[segment.toLowerCase()];

  return known ?? segment.charAt(0).toUpperCase() + segment.slice(1);
};

// Payload keys like `hm.shard1` are what the proxy calls a node; people read
// "Heatmap · Shard 1". An admin-chosen name wins over the derived one.
export const formatNodeLabel = (
  nodeKey: string,
  customLabels: NodeLabels = {},
): string => {
  const custom = customLabels[nodeKey]?.trim();

  if (custom !== undefined && custom.length > 0) {
    return custom;
  }

  return nodeKey
    .split('.')
    .filter((segment) => segment.length > 0)
    .map(formatSegment)
    .join(' · ');
};

import { describe, expect, it } from 'vitest';

import { formatNodeLabel } from '../format-node-label.util';

describe('formatNodeLabel', () => {
  it('derives a readable name from the payload key', () => {
    expect(formatNodeLabel('hm.shard1')).toBe('Heatmap · Shard 1');
    expect(formatNodeLabel('api.shard2')).toBe('API · Shard 2');
    expect(formatNodeLabel('proxy')).toBe('Proxy');
    expect(formatNodeLabel('search.node3')).toBe('Search · Node3');
  });

  it('prefers the name an admin chose', () => {
    expect(formatNodeLabel('hm.shard1', { 'hm.shard1': ' Heatmap EU ' })).toBe(
      'Heatmap EU',
    );
    expect(formatNodeLabel('hm.shard2', { 'hm.shard1': 'Heatmap EU' })).toBe(
      'Heatmap · Shard 2',
    );
  });
});

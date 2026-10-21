import { describe, expect, it } from 'vitest';

import { flattenHealthPayload } from '../flatten-health-payload.util';
import { buildHealthPayload } from './health-payload.fixture';

describe('flattenHealthPayload', () => {
  it('lists the proxy and every downstream shard as its own node', () => {
    const nodes = flattenHealthPayload(buildHealthPayload());

    expect(nodes.map((node) => node.key)).toEqual([
      'proxy',
      'api.shard1',
      'hm.shard1',
      'ping.shard1',
      'ping.shard2',
    ]);
  });

  it('reads system metrics and pm2 processes', () => {
    const [, api] = flattenHealthPayload(buildHealthPayload());

    expect(api).toMatchObject({
      host: '10.0.1.1',
      cpuPercent: 23.42,
      memoryPercent: 36.19,
      diskPercent: 17.78,
    });
    expect(api.processes).toHaveLength(3);
    expect(api.processes[1]).toMatchObject({
      name: 'event.cluster',
      pm2Id: 1,
      memoryMegabytes: 415,
      restarts: 9,
    });
  });

  it('returns nothing for the header-less answer', () => {
    expect(flattenHealthPayload({ status: 'ok' })).toEqual([]);
  });
});

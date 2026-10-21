import { describe, expect, it } from 'vitest';

import { normalizeHealthMonitorConfig } from '../normalize-health-monitor-config.util';

describe('normalizeHealthMonitorConfig', () => {
  it('falls back to the allowed options and keeps an empty secret as "unchanged"', () => {
    const config = normalizeHealthMonitorConfig({
      endpointUrl: 'https://api.example.com/health',
      intervalMinutes: 3,
      snapshotRetentionHours: 72,
      headerValue: '  ',
      recipients: [
        { memberId: 'a', minSeverity: 'CRITICAL' },
        { memberId: 'a', minSeverity: 'WARNING' },
        { memberId: '' },
      ],
    });

    expect(config).toMatchObject({
      intervalMinutes: 1,
      snapshotRetentionHours: 72,
      headerValue: null,
      headerName: 'x-health-secret-key',
    });
    expect(config.recipients).toEqual([
      { memberId: 'a', minSeverity: 'CRITICAL' },
    ]);
  });

  it('rejects an endpoint that is not http(s)', () => {
    expect(() =>
      normalizeHealthMonitorConfig({ endpointUrl: 'ftp://example.com' }),
    ).toThrow('endpoint');
  });

  it('rejects a malformed extra email', () => {
    expect(() =>
      normalizeHealthMonitorConfig({
        endpointUrl: 'https://a.io/health',
        extraEmails: ['nope'],
      }),
    ).toThrow('nope');
  });

  it('rejects a warning threshold above the critical one', () => {
    expect(() =>
      normalizeHealthMonitorConfig({
        endpointUrl: 'https://a.io/health',
        rules: [{ metric: 'NODE_CPU', warningValue: 90, criticalValue: 80 }],
      }),
    ).toThrow('Rule 1');
  });
});

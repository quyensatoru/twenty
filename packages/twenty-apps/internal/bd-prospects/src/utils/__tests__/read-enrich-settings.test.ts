import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENRICH_HOUR,
  readEnrichSettings,
} from '../read-enrich-settings';

describe('readEnrichSettings', () => {
  it('defaults to enabled at 4 UTC', () => {
    expect(readEnrichSettings({})).toEqual({
      enabled: true,
      recheckHour: 4,
    });
  });

  it('reads an explicit off switch and hour', () => {
    expect(
      readEnrichSettings({
        ENRICH_ENABLED: 'false',
        ENRICH_HOUR: '9',
      }),
    ).toEqual({ enabled: false, recheckHour: 9 });
  });

  it('falls back on garbage', () => {
    expect(
      readEnrichSettings({ ENRICH_ENABLED: 'yes', ENRICH_HOUR: 'brunch' }),
    ).toEqual({ enabled: true, recheckHour: DEFAULT_ENRICH_HOUR });
    expect(readEnrichSettings({ ENRICH_HOUR: '25' })).toMatchObject({
      recheckHour: DEFAULT_ENRICH_HOUR,
    });
  });
});

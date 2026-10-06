import { describe, expect, it } from 'vitest';

import {
  readCrispCredentials,
  readCrispSettings,
  resolveCrispWebsiteIds,
} from '../read-crisp-settings';

describe('readCrispSettings', () => {
  it('defaults to enabled with no websites', () => {
    expect(readCrispSettings({})).toEqual({
      enabled: true,
      websiteId: '',
      websiteIdsByAppKey: {},
    });
  });

  it('reads an explicit off switch and every website id', () => {
    expect(
      readCrispSettings({
        CRISP_ENABLED: 'false',
        CRISP_WEBSITE_ID: ' fallback ',
        CRISP_WEBSITE_ID_BLOY: 'bloy-site',
        CRISP_WEBSITE_ID_MIDA: 'mida-site',
      }),
    ).toEqual({
      enabled: false,
      websiteId: 'fallback',
      websiteIdsByAppKey: { BLOY: 'bloy-site', MIDA: 'mida-site' },
    });
  });

  it('drops blank per-app websites', () => {
    expect(
      readCrispSettings({ CRISP_WEBSITE_ID_BLOY: '  ' }),
    ).toEqual({
      enabled: true,
      websiteId: '',
      websiteIdsByAppKey: {},
    });
  });
});

describe('resolveCrispWebsiteIds', () => {
  const settings = {
    enabled: true,
    websiteId: 'fallback',
    websiteIdsByAppKey: { BLOY: 'bloy-site', MIDA: 'mida-site' },
  };

  it('tries the shop’s own apps first', () => {
    expect(
      resolveCrispWebsiteIds({ ourApps: ['MIDA'], settings }),
    ).toEqual(['mida-site', 'bloy-site', 'fallback']);
  });

  it('falls back to every inbox for shops with no app', () => {
    expect(resolveCrispWebsiteIds({ settings })).toEqual([
      'bloy-site',
      'mida-site',
      'fallback',
    ]);
    expect(
      resolveCrispWebsiteIds({ ourApps: [], settings }),
    ).toEqual(['bloy-site', 'mida-site', 'fallback']);
  });

  it('dedupes repeated website ids and ignores unknown apps', () => {
    expect(
      resolveCrispWebsiteIds({
        ourApps: ['MIDA', 'mida', 'UNKNOWN_APP'],
        settings: {
          enabled: true,
          websiteId: 'mida-site',
          websiteIdsByAppKey: { BLOY: 'bloy-site', MIDA: 'mida-site' },
        },
      }),
    ).toEqual(['mida-site', 'bloy-site']);
  });

  it('resolves to nothing when unconfigured', () => {
    expect(
      resolveCrispWebsiteIds({
        ourApps: ['BLOY'],
        settings: { enabled: true, websiteId: '', websiteIdsByAppKey: {} },
      }),
    ).toEqual([]);
  });
});

describe('readCrispCredentials', () => {
  it('reads the identifier and key pair', () => {
    expect(
      readCrispCredentials({
        CRISP_API_IDENTIFIER: 'id-1',
        CRISP_API_KEY: ' key-1 ',
      }),
    ).toEqual({ identifier: 'id-1', key: 'key-1' });
  });

  it('fails fast with a Settings pointer when incomplete', () => {
    expect(() =>
      readCrispCredentials({ CRISP_API_IDENTIFIER: 'id-1' }),
    ).toThrow(/Settings > Apps > BD Prospects/);
    expect(() => readCrispCredentials({})).toThrow(
      /CRISP_API_IDENTIFIER/,
    );
  });
});

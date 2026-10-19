import { describe, expect, it } from 'vitest';

import {
  canWritePlanData,
  listCrispAppNames,
  readCrispSettings,
} from '../read-crisp-settings.util';

describe('readCrispSettings', () => {
  it('reads a website shared by two products once, under the first', () => {
    expect(
      readCrispSettings({
        CRISP_WEBSITE_ID_MIDA: 'mida-website',
        CRISP_WEBSITE_ID_BLOY: 'bloy-website',
        CRISP_WEBSITE_ID_FRAUD: 'mida-website',
        CRISP_WEBSITE_ID_EU: '',
      }).websites,
    ).toEqual([
      { appName: 'MIDA', websiteId: 'mida-website' },
      { appName: 'BLOY', websiteId: 'bloy-website' },
    ]);
  });

  it('lists the products answering in a shared website', () => {
    expect(
      listCrispAppNames(
        readCrispSettings({
          CRISP_WEBSITE_ID_MIDA: 'mida-website',
          CRISP_WEBSITE_ID_BLOY: 'bloy-website',
        }),
      ),
    ).toEqual(['MIDA', 'FRAUD', 'BLOY', 'EU']);
  });

  it('writes plan data only once it is switched on', () => {
    const configured = {
      CRISP_PLUGIN_IDENTIFIER: 'identifier',
      CRISP_PLUGIN_KEY: 'key',
      CRISP_WEBSITE_ID_BLOY: 'bloy-website',
    };

    expect(canWritePlanData(readCrispSettings(configured))).toBe(false);
    expect(
      canWritePlanData(
        readCrispSettings({ ...configured, CRISP_PLAN_DATA_ENABLED: 'true' }),
      ),
    ).toBe(true);
    expect(
      canWritePlanData(
        readCrispSettings({
          ...configured,
          CRISP_PLAN_DATA_ENABLED: 'true',
          CRISP_SYNC_ENABLED: 'false',
        }),
      ),
    ).toBe(false);
  });
});

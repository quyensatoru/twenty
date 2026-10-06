import { describe, expect, it } from 'vitest';

import {
  readCrispSettings,
  resolveCrispWorkspaces,
} from '../read-crisp-settings';

describe('readCrispSettings', () => {
  it('defaults to enabled with an empty fallback workspace', () => {
    expect(readCrispSettings({})).toEqual({
      enabled: true,
      fallbackWorkspace: { identifier: '', key: '', websiteId: '' },
      workspacesByAppKey: {},
    });
  });

  it('reads an explicit off switch, the fallback and every app workspace', () => {
    expect(
      readCrispSettings({
        CRISP_ENABLED: 'false',
        CRISP_API_IDENTIFIER: ' fallback-id ',
        CRISP_API_KEY: 'fallback-key',
        CRISP_WEBSITE_ID: 'fallback-site',
        CRISP_API_IDENTIFIER_BLOY: 'bloy-id',
        CRISP_API_KEY_BLOY: 'bloy-key',
        CRISP_WEBSITE_ID_BLOY: 'bloy-site',
        CRISP_API_IDENTIFIER_MIDA: 'mida-id',
        CRISP_API_KEY_MIDA: 'mida-key',
        CRISP_WEBSITE_ID_MIDA: 'mida-site',
      }),
    ).toEqual({
      enabled: false,
      fallbackWorkspace: {
        identifier: 'fallback-id',
        key: 'fallback-key',
        websiteId: 'fallback-site',
      },
      workspacesByAppKey: {
        BLOY: {
          identifier: 'bloy-id',
          key: 'bloy-key',
          websiteId: 'bloy-site',
        },
        MIDA: {
          identifier: 'mida-id',
          key: 'mida-key',
          websiteId: 'mida-site',
        },
      },
    });
  });

  it('drops incomplete app workspaces', () => {
    expect(
      readCrispSettings({
        CRISP_API_IDENTIFIER_BLOY: 'bloy-id',
        CRISP_WEBSITE_ID_BLOY: 'bloy-site',
      }),
    ).toMatchObject({ workspacesByAppKey: {} });
  });
});

describe('resolveCrispWorkspaces', () => {
  const settings = {
    enabled: true,
    fallbackWorkspace: {
      identifier: 'fallback-id',
      key: 'fallback-key',
      websiteId: 'fallback-site',
    },
    workspacesByAppKey: {
      BLOY: { identifier: 'bloy-id', key: 'bloy-key', websiteId: 'bloy-site' },
      MIDA: { identifier: 'mida-id', key: 'mida-key', websiteId: 'mida-site' },
    },
  };

  it('tries the shop’s own workspace first', () => {
    expect(
      resolveCrispWorkspaces({ ourApps: ['MIDA'], settings }).map(
        (workspace) => workspace.websiteId,
      ),
    ).toEqual(['mida-site', 'bloy-site', 'fallback-site']);
  });

  it('covers every workspace for shops with no app', () => {
    expect(
      resolveCrispWorkspaces({ settings }).map(
        (workspace) => workspace.websiteId,
      ),
    ).toEqual(['bloy-site', 'mida-site', 'fallback-site']);
  });

  it('carries each workspace’s own credentials', () => {
    const [first] = resolveCrispWorkspaces({
      ourApps: ['BLOY'],
      settings,
    });

    expect(first).toEqual({
      identifier: 'bloy-id',
      key: 'bloy-key',
      websiteId: 'bloy-site',
    });
  });

  it('resolves to nothing when unconfigured', () => {
    expect(
      resolveCrispWorkspaces({
        ourApps: ['BLOY'],
        settings: {
          enabled: true,
          fallbackWorkspace: { identifier: '', key: '', websiteId: '' },
          workspacesByAppKey: {},
        },
      }),
    ).toEqual([]);
  });
});

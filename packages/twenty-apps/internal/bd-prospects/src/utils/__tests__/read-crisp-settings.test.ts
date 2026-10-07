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

  it('searches only the workspaces of the shop’s own apps', () => {
    expect(
      resolveCrispWorkspaces({ ourApps: ['MIDA'], settings }),
    ).toEqual([
      {
        appKey: 'MIDA',
        workspace: {
          identifier: 'mida-id',
          key: 'mida-key',
          websiteId: 'mida-site',
        },
      },
    ]);
  });

  it('gives a shop on several apps one workspace per app', () => {
    expect(
      resolveCrispWorkspaces({ ourApps: ['mida', 'BLOY'], settings }).map(
        ({ appKey, workspace }) => `${appKey}:${workspace.websiteId}`,
      ),
    ).toEqual(['BLOY:bloy-site', 'MIDA:mida-site']);
  });

  it('skips shops with no app of ours', () => {
    expect(resolveCrispWorkspaces({ settings })).toEqual([]);
    expect(resolveCrispWorkspaces({ ourApps: [], settings })).toEqual([]);
  });

  it('lends the fallback triple to an app without its own', () => {
    expect(
      resolveCrispWorkspaces({
        ourApps: ['BLOY'],
        settings: { ...settings, workspacesByAppKey: {} },
      }).map(({ appKey, workspace }) => `${appKey}:${workspace.websiteId}`),
    ).toEqual(['BLOY:fallback-site']);
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

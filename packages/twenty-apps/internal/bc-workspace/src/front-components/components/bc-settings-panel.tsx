import { useCallback, useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconSettings } from 'twenty-ui/icon';
import { Banner, Loader } from 'twenty-ui/primitives/feedback';
import { Tabs } from 'twenty-ui/primitives/navigation';

import {
  SETTINGS_ROUTE_PATH,
  SETTINGS_SAVE_ROUTE_PATH,
} from '../../constants/route-paths';
import { type SettingsResult, type SettingsSaveBody } from '../../types/settings';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { BcSidePanel } from './bc-side-panel';
import { BC_TOKENS, spacing } from './bc-theme';
import { SettingsIntegrationsTab } from './settings-integrations-tab';
import { SettingsPlansTab } from './settings-plans-tab';
import { SettingsTeamsTab } from './settings-teams-tab';

type SettingsTab = 'teams' | 'plans' | 'integrations';

export const BcSettingsPanel = ({
  width,
  onClose,
  onChanged,
}: {
  width: number | string;
  onClose: () => void;
  onChanged: () => void;
}) => {
  const [settings, setSettings] = useState<SettingsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<SettingsTab>('teams');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await postAppRoute<SettingsResult & { success: true }>(
        SETTINGS_ROUTE_PATH,
        {},
      );

      setSettings(result);
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (body: SettingsSaveBody): Promise<boolean> => {
    setIsSaving(true);

    try {
      const result = await postAppRoute<SettingsResult & { success: true }>(
        SETTINGS_SAVE_ROUTE_PATH,
        body,
      );

      setSettings(result);
      onChanged();
      void enqueueSnackbar({ message: t('Saved'), variant: 'success' });

      return true;
    } catch (saveError) {
      void enqueueSnackbar({ message: readErrorText(saveError), variant: 'error' });

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BcSidePanel
      title={t('BC Workspace settings')}
      icon={<IconSettings size={16} />}
      ariaLabel={t('BC Workspace settings')}
      width={width}
      onClose={onClose}
    >
      <div
        style={{
          borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
          padding: `0 ${spacing(4)}`,
        }}
      >
        <Tabs.Root
          value={tab}
          onValueChange={(value) => {
            if (value === 'teams' || value === 'plans' || value === 'integrations') {
              setTab(value);
            }
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="teams">{t('Teams & members')}</Tabs.Tab>
            <Tabs.Tab value="plans">{t('Plans')}</Tabs.Tab>
            <Tabs.Tab value="integrations">{t('Integrations')}</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      </div>
      {error !== null && settings === null && (
        <div style={{ padding: spacing(4) }}>
          <Banner color="danger" variant="secondary">
            {error}
          </Banner>
        </div>
      )}
      {settings === null && error === null && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing(8) }}>
          <Loader />
        </div>
      )}
      {settings !== null && tab === 'teams' && (
        <SettingsTeamsTab settings={settings} isSaving={isSaving} onSave={save} />
      )}
      {settings !== null && tab === 'plans' && (
        <SettingsPlansTab settings={settings} isSaving={isSaving} onSave={save} />
      )}
      {settings !== null && tab === 'integrations' && (
        <SettingsIntegrationsTab settings={settings} isSaving={isSaving} onSave={save} />
      )}
    </BcSidePanel>
  );
};

import { t } from 'twenty-sdk/front-component';
import { Banner } from 'twenty-ui/primitives/feedback';

import { type HealthMonitorConfig } from '../../types/health-monitor-config';
import { useHealthConfig } from '../hooks/use-health-config';
import { ConfigDrawer } from './config-drawer';
import { ConfigDrawerSkeleton } from './config-drawer-skeleton';
import { DrawerShell } from './drawer-shell';

type ConfigLoaderProps = {
  appId: string;
  onClose: () => void;
  onSaved: () => void;
};

export const ConfigLoader = ({
  appId,
  onClose,
  onSaved,
}: ConfigLoaderProps) => {
  const config = useHealthConfig(appId);

  if (config.data === null) {
    return (
      <DrawerShell title={t('Monitor settings')} onClose={onClose}>
        {config.error === null ? (
          <ConfigDrawerSkeleton />
        ) : (
          <Banner color="danger">{config.error}</Banner>
        )}
      </DrawerShell>
    );
  }

  return (
    <ConfigDrawer
      source={config.data}
      onClose={onClose}
      onSave={async (draft: HealthMonitorConfig) => {
        await config.save(draft);
        onSaved();
      }}
    />
  );
};

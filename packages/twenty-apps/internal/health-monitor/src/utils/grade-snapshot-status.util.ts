import { type HealthBreach } from '../types/health-breach';
import { type HealthSnapshotStatus } from '../types/health-snapshot-status';

export const gradeSnapshotStatus = (
  breaches: HealthBreach[],
): HealthSnapshotStatus => {
  const stateBreaches = breaches.filter((breach) => !breach.isEvent);

  if (stateBreaches.some((breach) => breach.severity === 'CRITICAL')) {
    return 'CRITICAL';
  }

  return stateBreaches.length > 0 ? 'WARNING' : 'OK';
};

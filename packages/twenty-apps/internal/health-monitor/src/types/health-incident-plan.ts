import { type HealthIncidentRecord } from './health-incident-record';

export type HealthNotificationKind =
  | 'OPENED'
  | 'ESCALATED'
  | 'REMINDER'
  | 'RESOLVED'
  | 'EVENT';

export type HealthIncidentDraft = Omit<
  HealthIncidentRecord,
  'id' | 'monitorId'
> & {
  id: string | null;
};

export type HealthIncidentPlan =
  | {
      action: 'create' | 'update';
      incident: HealthIncidentDraft;
      notification: HealthNotificationKind | null;
    }
  | { action: 'delete'; incidentId: string };

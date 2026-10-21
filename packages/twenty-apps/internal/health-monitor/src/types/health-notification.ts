import {
  type HealthIncidentDraft,
  type HealthNotificationKind,
} from './health-incident-plan';

export type HealthNotification = {
  kind: HealthNotificationKind;
  incident: HealthIncidentDraft;
};

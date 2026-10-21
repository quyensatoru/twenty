import { type HealthSeverity } from './health-severity';

export type HealthRecipient = {
  memberId: string;
  minSeverity: HealthSeverity;
};

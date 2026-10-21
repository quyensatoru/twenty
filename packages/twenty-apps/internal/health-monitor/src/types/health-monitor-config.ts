import { type HealthMonitorPolicy } from './health-monitor-record';
import { type HealthRecipient } from './health-recipient';
import { type HealthRule } from './health-rule';

// What the configuration drawer reads and writes. The header value is never
// sent back to the browser: `hasHeaderValue` says whether one is stored, and
// a save with `headerValue` null keeps it.
export type HealthMonitorConfig = HealthMonitorPolicy & {
  isEnabled: boolean;
  endpointUrl: string;
  headerName: string;
  headerValue: string | null;
  hasHeaderValue: boolean;
  recipients: HealthRecipient[];
  extraEmails: string[];
  rules: HealthRule[];
  mutedNodeKeys: string[];
  nodeLabels: Record<string, string>;
};

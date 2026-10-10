import type { GitProviderName } from './git-api.util';

// Provider webhook registrations live in kv, keyed by our repository row —
// never on the row itself, so a secret never reaches the UI or the REST API.
export type GitWebhookRegistration = {
  provider: GitProviderName;
  connectionId: string;
  hookId: string;
  secret: string;
  isActive: boolean;
};

export const getGitWebhookRegistrationKey = (repositoryId: string): string =>
  `git:webhook-registration:${repositoryId}`;

// Server-scoped claim so the public webhook resolver can map an incoming
// delivery back to its workspace. Mirrors the connected-account claim: the
// value is claimed at connect time, the resolver only reads it back.
export const getGitConnectionClaimKey = (connectedAccountId: string): string =>
  `git:connection-claim:${connectedAccountId}`;

export type GitSyncHealth = {
  lastSyncedAt: string | null;
  error: string | null;
  unknownIssueKeys?: string[];
  liveSyncError?: string | null;
};
export const getGitSyncHealthKey = (repositoryId: string): string =>
  `git:sync-health:${repositoryId}`;
export const getGitWebhookHealthKey = (repositoryId: string): string =>
  `git:webhook-health:${repositoryId}`;
export const getGitSyncJobKey = (repositoryId: string): string =>
  `git:sync-job:${repositoryId}`;

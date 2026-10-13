import { kv } from 'twenty-sdk/logic-function';

import {
  CRISP_SYNC_STATE_KEY,
  getCrispWebsiteClaimKey,
} from '../../constants/crisp';
import { readErrorMessage } from './read-error-message.util';
import { type CrispSettings } from './read-crisp-settings.util';

export type CrispSyncState = {
  lastSyncedAt: string | null;
  lastError: string | null;
};

const EMPTY_SYNC_STATE: CrispSyncState = {
  lastSyncedAt: null,
  lastError: null,
};

export const readCrispSyncState = async (): Promise<CrispSyncState> => {
  const stored = await kv.get<Partial<CrispSyncState>>(CRISP_SYNC_STATE_KEY);

  return { ...EMPTY_SYNC_STATE, ...(stored ?? {}) };
};

export const writeCrispSyncState = async (
  patch: Partial<CrispSyncState>,
): Promise<void> => {
  const current = await readCrispSyncState();

  await kv.set(CRISP_SYNC_STATE_KEY, { ...current, ...patch });
};

// The public web hook resolver has no workspace of its own; these claims are
// how it finds the one that configured each Crisp website.
export const claimCrispWebsites = async (
  settings: CrispSettings,
): Promise<string[]> => {
  const errors: string[] = [];

  for (const website of settings.websites) {
    try {
      await kv.set(getCrispWebsiteClaimKey(website.websiteId), null, {
        scope: 'SERVER',
      });
    } catch (error) {
      errors.push(`${website.appName}: ${readErrorMessage(error)}`);
    }
  }

  return errors;
};

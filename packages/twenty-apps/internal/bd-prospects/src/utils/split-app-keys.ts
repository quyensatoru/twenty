import { isSellableAppKey } from '../constants/registered-apps';

import { mergeAppKeys } from './app-key';

export type AppColumns = {
  ourApps: string[];
  otherApps: string[];
};

// Stored rows come back with nulls, not missing keys.
export type StoredAppColumns = {
  ourApps?: string[] | null;
  otherApps?: string[] | null;
};

// Apps of ours go in a MULTI_SELECT and so must be declared; everything else
// goes in a free-text list. Splitting here rather than at each call site keeps
// the merchant sync and the CSV import from drifting apart on the rule.
//
// Both columns merge with what is already stored. Used by the CSV import, where
// a file only knows about the app it came from and must not erase the rest.
export const splitAppKeys = (
  appKeys: string[],
  previous?: StoredAppColumns,
): AppColumns => ({
  ourApps: mergeAppKeys(
    previous?.ourApps,
    appKeys.filter((appKey) => isSellableAppKey(appKey)),
  ),
  otherApps: mergeAppKeys(
    previous?.otherApps,
    appKeys.filter((appKey) => !isSellableAppKey(appKey)),
  ),
});

// The merchant sync's variant: BLOY and MIDA push install AND uninstall into
// the CRM, so their merchant rows are the truth and `ourApps` is replaced, not
// merged — a shop that uninstalled must fall back into the candidate list.
// `otherApps` still merges: a third-party app may have arrived by CSV with no
// merchant row to confirm it, and dropping it would lose the only record we
// have.
export const applyMerchantAppKeys = (
  appKeysFromMerchants: string[],
  previous?: StoredAppColumns,
): AppColumns => ({
  ourApps: [
    ...new Set(
      appKeysFromMerchants.filter((appKey) => isSellableAppKey(appKey)),
    ),
  ].sort(),
  otherApps: mergeAppKeys(
    previous?.otherApps,
    appKeysFromMerchants.filter((appKey) => !isSellableAppKey(appKey)),
  ),
});

export const haveAppColumnsChanged = (
  next: AppColumns,
  previous: StoredAppColumns,
): boolean =>
  next.ourApps.join(',') !== (previous.ourApps ?? []).join(',') ||
  next.otherApps.join(',') !== (previous.otherApps ?? []).join(',');

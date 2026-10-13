import { type CrispConversationMeta } from '../../types/crisp-api';

const MYSHOPIFY_DOMAIN_PATTERN = /[a-z0-9][a-z0-9-]*\.myshopify\.com/gi;

// The apps push the shop onto the Crisp session in different places (custom
// data, nickname, subject, segments), so every string the session carries is
// scanned rather than one agreed key.
export const extractShopDomains = (
  meta: CrispConversationMeta | undefined,
): string[] => {
  if (meta === undefined) {
    return [];
  }

  const sources = [
    ...Object.values(meta.data ?? {}).map((value) => String(value)),
    meta.nickname,
    meta.email,
    meta.subject,
    meta.origin,
    ...(meta.segments ?? []),
  ].filter((source): source is string => typeof source === 'string');

  const domains = new Set<string>();

  for (const source of sources) {
    for (const match of source.matchAll(MYSHOPIFY_DOMAIN_PATTERN)) {
      domains.add(match[0].toLowerCase());
    }
  }

  return [...domains];
};

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// The visitor email first, then any address the app pushed as session data
// (BLOY sends the store's own email as bloy_store_email): the visitor is
// often a staff member writing from a personal address.
export const extractContactEmails = (
  meta: CrispConversationMeta | undefined,
): string[] => {
  if (meta === undefined) {
    return [];
  }

  const sources = [
    meta.email,
    ...Object.values(meta.data ?? {}).map((value) => String(value)),
  ].filter((source): source is string => typeof source === 'string');
  const emails = new Set<string>();

  for (const source of sources) {
    for (const match of source.matchAll(EMAIL_PATTERN)) {
      emails.add(match[0].toLowerCase());
    }
  }

  return [...emails];
};

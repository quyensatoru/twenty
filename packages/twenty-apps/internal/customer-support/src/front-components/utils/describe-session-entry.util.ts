export type SessionValueKind =
  'boolean' | 'date' | 'email' | 'url' | 'number' | 'text';

export type SessionEntry = {
  key: string;
  label: string;
  isTranslatable: boolean;
  kind: SessionValueKind;
  value: string | number | boolean;
  isHighlight: boolean;
};

// Keys the apps push onto Crisp, named for a person. Matched after the app
// prefix is stripped (bloy_app_plan -> app_plan), so MIDA and BLOY share them.
const KNOWN_KEYS: Record<string, { label: string; isHighlight?: boolean }> = {
  app_plan: { label: 'App plan', isHighlight: true },
  plan: { label: 'App plan', isHighlight: true },
  shopify_plan: { label: 'Shopify plan', isHighlight: true },
  price: { label: 'Price', isHighlight: true },
  trial_day_left: { label: 'Trial days left', isHighlight: true },
  app_plan_group: { label: 'Plan group' },
  store_email: { label: 'Store email' },
  email: { label: 'Email' },
  shop: { label: 'Shop' },
  domain: { label: 'Shop' },
  using: { label: 'Using the app' },
  installed: { label: 'App installed' },
  trigger_first_reply: { label: 'First reply sent' },
  last_ooo_weekdays_message_at: { label: 'Last out-of-office reply' },
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\//;
// Epoch values stored under a *_at key, in seconds or milliseconds.
const EPOCH_RANGE_SECONDS = [946_684_800, 4_102_444_800];

const toSentenceCase = (key: string): string => {
  const words = key.replace(/[_-]+/g, ' ').trim();

  return words.length === 0
    ? key
    : `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

const readKind = (
  key: string,
  value: string | number | boolean,
): SessionValueKind => {
  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (typeof value === 'number') {
    const seconds = value > 1e12 ? value / 1000 : value;

    return /_at$/.test(key) &&
      seconds >= EPOCH_RANGE_SECONDS[0] &&
      seconds <= EPOCH_RANGE_SECONDS[1]
      ? 'date'
      : 'number';
  }

  if (ISO_DATE_PATTERN.test(value)) {
    return 'date';
  }

  if (EMAIL_PATTERN.test(value)) {
    return 'email';
  }

  return URL_PATTERN.test(value) ? 'url' : 'text';
};

export const describeSessionEntry = ({
  key,
  value,
  appName,
}: {
  key: string;
  value: string | number | boolean;
  appName: string | null;
}): SessionEntry => {
  const lowerKey = key.toLowerCase();
  const appPrefix = appName === null ? null : appName.toLowerCase();
  let normalizedKey = lowerKey;

  if (appPrefix !== null) {
    if (lowerKey === appPrefix) {
      normalizedKey = 'installed';
    } else if (lowerKey === `using_${appPrefix}`) {
      normalizedKey = 'using';
    } else if (lowerKey.startsWith(`${appPrefix}_`)) {
      normalizedKey = lowerKey.slice(appPrefix.length + 1);
    }
  }

  const known = KNOWN_KEYS[normalizedKey];

  return {
    key,
    label: known?.label ?? toSentenceCase(normalizedKey),
    isTranslatable: known !== undefined,
    kind: readKind(lowerKey, value),
    value,
    isHighlight: known?.isHighlight === true,
  };
};

export const describeSessionData = (
  sessionData: Record<string, unknown> | null,
  appName: string | null,
): SessionEntry[] =>
  Object.entries(sessionData ?? {})
    .filter(
      (entry): entry is [string, string | number | boolean] =>
        (typeof entry[1] === 'string' && entry[1].trim().length > 0) ||
        typeof entry[1] === 'number' ||
        typeof entry[1] === 'boolean',
    )
    .map(([key, value]) => describeSessionEntry({ key, value, appName }));

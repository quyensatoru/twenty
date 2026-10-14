import { t } from 'twenty-sdk/front-component';

import {
  type MerchantFieldOption,
  type MerchantRecordField,
} from '../hooks/use-merchant-record-fields';
import {
  formatFriendlyDate,
  formatRelativeTime,
} from '../support-conversation/utils/format-inbox-time.util';

export type MerchantFieldDisplay =
  | { kind: 'text'; text: string; hint?: string }
  | { kind: 'email'; text: string; hint?: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'pills'; items: { label: string; color: string }[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const readOption = (options: MerchantFieldOption[], value: string) => {
  const option = options.find((candidate) => candidate.value === value);

  return { label: option?.label ?? value, color: option?.color ?? 'gray' };
};

const readAdditional = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => readString(item) !== null)
    : [];

const withMore = (primary: string, additional: string[]): string =>
  additional.length === 0
    ? primary
    : `${primary} ${t('+{count} more', { count: additional.length })}`;

// null means empty: the preview gathers those under one toggle instead of a
// column of dashes.
export const readMerchantFieldDisplay = (
  field: MerchantRecordField,
): MerchantFieldDisplay | null => {
  const { value } = field;

  if (field.relatedLabel !== undefined) {
    return field.relatedLabel === null
      ? null
      : { kind: 'text', text: field.relatedLabel };
  }

  if (field.relatedCount !== undefined) {
    return field.relatedCount === null || field.relatedCount === 0
      ? null
      : { kind: 'text', text: field.relatedCount.toLocaleString() };
  }

  switch (field.type) {
    case 'BOOLEAN':
      return typeof value === 'boolean'
        ? { kind: 'text', text: value ? t('Yes') : t('No') }
        : null;
    case 'DATE':
    case 'DATE_TIME': {
      const text = readString(value);

      return text === null
        ? null
        : {
            kind: 'text',
            text: formatFriendlyDate(text),
            hint: formatRelativeTime(text),
          };
    }
    case 'NUMBER':
    case 'NUMERIC':
    case 'RATING':
      return typeof value === 'number' || readString(value) !== null
        ? { kind: 'text', text: String(value) }
        : null;
    case 'EMAILS': {
      const primary = isRecord(value) ? readString(value.primaryEmail) : null;

      return primary === null
        ? null
        : {
            kind: 'email',
            text: primary,
            hint:
              isRecord(value) &&
              readAdditional(value.additionalEmails).length > 0
                ? readAdditional(value.additionalEmails).join(', ')
                : undefined,
          };
    }
    case 'PHONES': {
      if (!isRecord(value)) return null;
      const number = readString(value.primaryPhoneNumber);

      return number === null
        ? null
        : {
            kind: 'text',
            text: `${readString(value.primaryPhoneCallingCode) ?? ''} ${number}`.trim(),
          };
    }
    case 'LINKS': {
      if (!isRecord(value)) return null;
      const url = readString(value.primaryLinkUrl);

      if (url === null) return null;
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;

      return {
        kind: 'link',
        text: withMore(
          readString(value.primaryLinkLabel) ?? url,
          Array.isArray(value.secondaryLinks) ? value.secondaryLinks : [],
        ),
        href,
      };
    }
    case 'CURRENCY': {
      if (!isRecord(value) || value.amountMicros === null) return null;
      const amount = Number(value.amountMicros) / 1_000_000;

      return Number.isFinite(amount)
        ? {
            kind: 'text',
            text: `${amount.toLocaleString()} ${readString(value.currencyCode) ?? ''}`.trim(),
          }
        : null;
    }
    case 'FULL_NAME': {
      if (!isRecord(value)) return null;
      const text = [readString(value.firstName), readString(value.lastName)]
        .filter((part) => part !== null)
        .join(' ');

      return text === '' ? null : { kind: 'text', text };
    }
    case 'ADDRESS': {
      if (!isRecord(value)) return null;
      const text = [
        value.addressStreet1,
        value.addressStreet2,
        value.addressCity,
        value.addressState,
        value.addressPostcode,
        value.addressCountry,
      ]
        .map(readString)
        .filter((part) => part !== null)
        .join(', ');

      return text === '' ? null : { kind: 'text', text };
    }
    case 'ACTOR': {
      if (!isRecord(value)) return null;
      const name = readString(value.name);

      return name === null ? null : { kind: 'text', text: name };
    }
    case 'SELECT': {
      const selected = readString(value);

      return selected === null
        ? null
        : { kind: 'pills', items: [readOption(field.options, selected)] };
    }
    case 'MULTI_SELECT': {
      const selected = Array.isArray(value)
        ? value.filter((item): item is string => readString(item) !== null)
        : [];

      return selected.length === 0
        ? null
        : {
            kind: 'pills',
            items: selected.map((item) => readOption(field.options, item)),
          };
    }
    case 'ARRAY': {
      const items = readAdditional(value);

      return items.length === 0
        ? null
        : { kind: 'text', text: items.join(', ') };
    }
    case 'RICH_TEXT':
    case 'RICH_TEXT_V2': {
      const markdown = isRecord(value)
        ? readString(value.markdown)
        : readString(value);

      return markdown === null ? null : { kind: 'text', text: markdown };
    }
    case 'FILES':
      return Array.isArray(value) && value.length > 0
        ? {
            kind: 'text',
            text: t('{count} files', { count: value.length }),
          }
        : null;
    case 'RAW_JSON':
      return value === null || value === undefined
        ? null
        : { kind: 'text', text: JSON.stringify(value) };
    default: {
      const text = readString(value);

      return text === null ? null : { kind: 'text', text };
    }
  }
};

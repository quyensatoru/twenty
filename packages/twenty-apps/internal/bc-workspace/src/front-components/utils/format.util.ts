const toDate = (value: string | null | undefined): Date | null => {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (
  value: string | null | undefined,
  locale?: string,
): string => {
  const date = toDate(value);

  return date === null
    ? '—'
    : date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
};

export const formatDateTime = (
  value: string | null | undefined,
  locale?: string,
): string => {
  const date = toDate(value);

  return date === null
    ? '—'
    : date.toLocaleString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};

export const formatNumber = (value: number | null | undefined, locale?: string): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString(locale, { maximumFractionDigits: 1 })
    : '—';

export const formatPercent = (value: number | null | undefined, locale?: string): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${(value * 100).toLocaleString(locale, { maximumFractionDigits: 0 })}%`
    : '—';

export const formatCurrency = (
  value: number | null | undefined,
  currency: string,
  locale?: string,
): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }

  try {
    return value.toLocaleString(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
  } catch {
    return `${value.toLocaleString(locale, { maximumFractionDigits: 0 })} ${currency}`;
  }
};

export const readInitials = (name: string | null | undefined): string =>
  (name ?? '')
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

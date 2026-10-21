const pad = (value: number) => String(value).padStart(2, '0');

// The team works in Vietnam, which keeps no daylight saving, so the dashboard
// renders every time in a fixed +07:00.
const toLocal = (iso: string) => new Date(Date.parse(iso) + 7 * 3_600_000);

export const formatPercent = (
  value: number | null | undefined,
  digits = 1,
): string =>
  value === null || value === undefined ? '–' : `${value.toFixed(digits)}%`;

export const formatMegabytes = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? '–'
    : value >= 1024
      ? `${(value / 1024).toFixed(1)} GB`
      : `${Math.round(value)} MB`;

export const formatMilliseconds = (value: number | null | undefined): string =>
  value === null || value === undefined ? '–' : `${Math.round(value)} ms`;

export const formatCount = (value: number): string =>
  value.toLocaleString('en-US');

export const formatClock = (iso: string | null | undefined): string => {
  if (!iso) return '–';

  const local = toLocal(iso);

  return `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
};

export const formatClockWithSeconds = (
  iso: string | null | undefined,
): string => {
  if (!iso) return '–';

  const local = toLocal(iso);

  return `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '–';

  const local = toLocal(iso);

  return `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
};

export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined) return '–';

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return `${hours}h ${minutes}m`;

  return `${minutes}m`;
};

export const formatSince = (
  iso: string | null | undefined,
  nowMs: number,
): string =>
  iso
    ? formatDuration(Math.max(0, Math.round((nowMs - Date.parse(iso)) / 1000)))
    : '–';

export const formatRangeLabel = (rangeHours: number): string =>
  rangeHours < 24
    ? `${rangeHours}h`
    : rangeHours === 24
      ? '24h'
      : `${rangeHours / 24}d`;

import { type TemplateVariables } from '../types/template-variables';
import { addUtcMonths } from './add-utc-months.util';

export type TemplateExpressionValue =
  | { kind: 'NUMBER'; value: number }
  | { kind: 'TEXT'; value: string }
  | { kind: 'MISSING' }
  | { kind: 'INVALID' };

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const EVENT_PREFIX = 'event.';
const FUNCTION_PATTERN = /^(daysSince|daysUntil|date)\s+(.+)$/;
const NAME_PATTERN = /^[a-zA-Z][\w.-]*$/;
const DATE_REFERENCE_PATTERN =
  /^(installedAt|uninstalledAt|addedToCrmAt|today|event\.[\w.-]+)\s*(?:([+-])\s*(\d+)\s*([dwm]))?$/;
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const readNow = (variables: TemplateVariables): Date => {
  const now =
    variables.now === undefined ? Date.now() : Date.parse(variables.now);

  return new Date(Number.isNaN(now) ? Date.now() : now);
};

const readDateValue = (value: string | null | undefined): Date | null => {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }

  const time = Date.parse(value.trim());

  return Number.isNaN(time) ? null : new Date(time);
};

const readEventProperty = (variables: TemplateVariables, name: string) =>
  variables.eventProperties?.[name.slice(EVENT_PREFIX.length)] ?? '';

const readSourceDate = (
  source: string,
  variables: TemplateVariables,
): Date | null => {
  if (source === 'today') {
    return readNow(variables);
  }

  if (source.startsWith(EVENT_PREFIX)) {
    return readDateValue(readEventProperty(variables, source));
  }

  return readDateValue(
    variables.dates?.[
      source as 'installedAt' | 'uninstalledAt' | 'addedToCrmAt'
    ],
  );
};

const shiftDate = (date: Date, amount: number, unit: string): Date =>
  unit === 'm'
    ? addUtcMonths(date, amount)
    : new Date(date.getTime() + amount * (unit === 'w' ? 7 : 1) * DAY_IN_MS);

const toUtcDayNumber = (date: Date): number =>
  Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      DAY_IN_MS,
  );

export const formatTemplateDate = (date: Date): string =>
  `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;

const resolveDateReference = (
  reference: string,
  variables: TemplateVariables,
): Date | null | undefined => {
  const match = reference.trim().match(DATE_REFERENCE_PATTERN);

  if (match === null) {
    return undefined;
  }

  const [, source, sign, amount, unit] = match;
  const date = readSourceDate(source, variables);

  if (date === null || amount === undefined) {
    return date;
  }

  return shiftDate(date, (sign === '-' ? -1 : 1) * Number(amount), unit);
};

export const isValidTemplateExpression = (expression: string): boolean => {
  const trimmed = expression.trim();
  const functionMatch = trimmed.match(FUNCTION_PATTERN);

  return functionMatch === null
    ? NAME_PATTERN.test(trimmed)
    : DATE_REFERENCE_PATTERN.test(functionMatch[2].trim());
};

// Day counts are whole UTC calendar days between the send time and the date,
// negative once the date is on the other side; display clamps them at zero.
export const evaluateTemplateExpression = (
  expression: string,
  variables: TemplateVariables,
): TemplateExpressionValue => {
  const trimmed = expression.trim();
  const functionMatch = trimmed.match(FUNCTION_PATTERN);

  if (functionMatch === null) {
    if (!NAME_PATTERN.test(trimmed)) {
      return { kind: 'INVALID' };
    }

    const value = trimmed.startsWith(EVENT_PREFIX)
      ? readEventProperty(variables, trimmed)
      : (variables as unknown as Record<string, unknown>)[trimmed];

    return { kind: 'TEXT', value: typeof value === 'string' ? value : '' };
  }

  const [, name, reference] = functionMatch;
  const date = resolveDateReference(reference, variables);

  if (date === undefined) {
    return { kind: 'INVALID' };
  }

  if (date === null) {
    return { kind: 'MISSING' };
  }

  if (name === 'date') {
    return { kind: 'TEXT', value: formatTemplateDate(date) };
  }

  const today = toUtcDayNumber(readNow(variables));
  const target = toUtcDayNumber(date);

  return {
    kind: 'NUMBER',
    value: name === 'daysSince' ? today - target : target - today,
  };
};

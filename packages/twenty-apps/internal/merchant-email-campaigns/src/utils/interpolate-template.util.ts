import { type TemplateVariables } from '../types/template-variables';

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z][\w.]*)\s*(?:\|([^}]*))?\}\}/g;
const EVENT_PREFIX = 'event.';

const readVariable = (
  variables: TemplateVariables,
  name: string,
): string | undefined =>
  name.startsWith(EVENT_PREFIX)
    ? variables.eventProperties?.[name.slice(EVENT_PREFIX.length)]
    : (variables as unknown as Record<string, string | undefined>)[name];

// `{{name}}`, `{{name|fallback}}` or `{{event.key}}`. Unknown names render as
// empty rather than leaking the raw placeholder into a customer's inbox.
export const interpolateTemplate = (
  template: string,
  variables: TemplateVariables,
  transformValue: (value: string) => string = (value) => value,
): string =>
  template.replace(VARIABLE_PATTERN, (_match, name: string, fallback) => {
    const value = readVariable(variables, name);
    const resolved =
      typeof value === 'string' && value.trim() !== ''
        ? value
        : (fallback ?? '').trim();

    return transformValue(resolved);
  });

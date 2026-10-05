import {
  ENRICH_ENABLED_VARIABLE,
  ENRICH_HOUR_VARIABLE,
} from '../constants/application-variable-names';

export const DEFAULT_ENRICH_HOUR = 4;

export type EnrichSettings = {
  enabled: boolean;
  recheckHour: number;
};

// Booleans and numbers travel as strings in the function env ("true", "4"),
// so both are parsed defensively back to their types.
export const readEnrichSettings = (
  env: Record<string, string | undefined> = process.env,
): EnrichSettings => {
  const enabled = (env[ENRICH_ENABLED_VARIABLE] ?? 'true').trim() !== 'false';

  const rawHour = (env[ENRICH_HOUR_VARIABLE] ?? '').trim();
  const parsedHour = rawHour === '' ? NaN : Number(rawHour);
  const recheckHour =
    Number.isInteger(parsedHour) && parsedHour >= 0 && parsedHour <= 23
      ? parsedHour
      : DEFAULT_ENRICH_HOUR;

  return { enabled, recheckHour };
};

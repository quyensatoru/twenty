import { CUSTOM_EMAIL_MAX_PER_MINUTE_VARIABLE } from '../constants/application-variable-names';
import { DEFAULT_CUSTOM_EMAIL_MAX_PER_MINUTE } from '../constants/send-limits';

export const readCustomEmailMaxPerMinute = (): number => {
  const value = Number(process.env[CUSTOM_EMAIL_MAX_PER_MINUTE_VARIABLE]);

  return Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : DEFAULT_CUSTOM_EMAIL_MAX_PER_MINUTE;
};

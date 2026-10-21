import viCatalog from '../../../locales/vi-VN.json';
import { ALERT_EMAIL_LANGUAGE_VARIABLE } from '../../constants/application-variable-names';
import {
  createCatalogTranslate,
  interpolate,
  type Translate,
} from '../../utils/translate.util';

// Emails reuse the dashboard's catalog, so one translation pass covers both.
export const readEmailTranslate = (): Translate =>
  (process.env[ALERT_EMAIL_LANGUAGE_VARIABLE] ?? '').trim() === 'vi-VN'
    ? createCatalogTranslate(viCatalog as Record<string, unknown>)
    : interpolate;

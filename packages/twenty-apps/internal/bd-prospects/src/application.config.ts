import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  ENRICH_ENABLED_VARIABLE,
  ENRICH_HOUR_VARIABLE,
  SERPER_API_KEY_VARIABLE,
} from './constants/application-variable-names';
import {
  ENRICH_ENABLED_VARIABLE_UID,
  ENRICH_HOUR_VARIABLE_UID,
  SERPER_API_KEY_VARIABLE_UID,
} from './constants/universal-identifiers';

export const APPLICATION_UNIVERSAL_IDENTIFIER =
  '64711277-a8e0-4272-97b1-55ce1a2a97b4';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'BD Prospects',
  description:
    'High-Value Prospects area for the BD team: Advanced/Plus shops, cross-app upsell candidates and deal pipeline.',
  applicationVariables: {
    [SERPER_API_KEY_VARIABLE]: {
      universalIdentifier: SERPER_API_KEY_VARIABLE_UID,
      description:
        'Serper API key from serper.dev > API Keys, used by the LinkedIn enrichment batch to find company pages.',
      isSecret: true,
    },
    [ENRICH_ENABLED_VARIABLE]: {
      universalIdentifier: ENRICH_ENABLED_VARIABLE_UID,
      description:
        'Whether the LinkedIn batch runs. Turn off without touching its schedule, e.g. while Serper credits run low.',
      type: FieldType.BOOLEAN,
      isSecret: false,
      value: true,
    },
    [ENRICH_HOUR_VARIABLE]: {
      universalIdentifier: ENRICH_HOUR_VARIABLE_UID,
      description:
        'New prospects drain every run, but already-checked ones are only re-checked during this UTC hour. Vietnam time is UTC+7, so 4 means 11:00 ICT.',
      type: FieldType.NUMBER,
      isSecret: false,
      value: 4,
    },
  },
});

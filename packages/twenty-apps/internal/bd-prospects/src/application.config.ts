import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  CRISP_API_IDENTIFIER_BLOY_VARIABLE,
  CRISP_API_IDENTIFIER_MIDA_VARIABLE,
  CRISP_API_IDENTIFIER_VARIABLE,
  CRISP_API_KEY_BLOY_VARIABLE,
  CRISP_API_KEY_MIDA_VARIABLE,
  CRISP_API_KEY_VARIABLE,
  CRISP_ENABLED_VARIABLE,
  CRISP_WEBSITE_ID_BLOY_VARIABLE,
  CRISP_WEBSITE_ID_MIDA_VARIABLE,
  CRISP_WEBSITE_ID_VARIABLE,
  ENRICH_ENABLED_VARIABLE,
  ENRICH_HOUR_VARIABLE,
  SERPER_API_KEY_VARIABLE,
} from './constants/application-variable-names';
import {
  CRISP_API_IDENTIFIER_BLOY_VARIABLE_UID,
  CRISP_API_IDENTIFIER_MIDA_VARIABLE_UID,
  CRISP_API_IDENTIFIER_VARIABLE_UID,
  CRISP_API_KEY_BLOY_VARIABLE_UID,
  CRISP_API_KEY_MIDA_VARIABLE_UID,
  CRISP_API_KEY_VARIABLE_UID,
  CRISP_ENABLED_VARIABLE_UID,
  CRISP_WEBSITE_ID_BLOY_VARIABLE_UID,
  CRISP_WEBSITE_ID_MIDA_VARIABLE_UID,
  CRISP_WEBSITE_ID_VARIABLE_UID,
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
    [CRISP_API_IDENTIFIER_VARIABLE]: {
      universalIdentifier: CRISP_API_IDENTIFIER_VARIABLE_UID,
      description:
        'Fallback Crisp REST API identifier, used for shops with no app yet. Shops running BLOY or MIDA use their own workspace credentials below.',
      isSecret: true,
    },
    [CRISP_API_KEY_VARIABLE]: {
      universalIdentifier: CRISP_API_KEY_VARIABLE_UID,
      description:
        'Fallback Crisp REST API key paired with the identifier above.',
      isSecret: true,
    },
    [CRISP_WEBSITE_ID_VARIABLE]: {
      universalIdentifier: CRISP_WEBSITE_ID_VARIABLE_UID,
      description:
        'Fallback Crisp website ID, used for shops with no app yet. Shops running BLOY or MIDA are searched in their own inbox first.',
      isSecret: false,
    },
    [CRISP_WEBSITE_ID_BLOY_VARIABLE]: {
      universalIdentifier: CRISP_WEBSITE_ID_BLOY_VARIABLE_UID,
      description:
        'Crisp website ID of the BLOY inbox, found in the Crisp dashboard URL.',
      isSecret: false,
    },
    [CRISP_WEBSITE_ID_MIDA_VARIABLE]: {
      universalIdentifier: CRISP_WEBSITE_ID_MIDA_VARIABLE_UID,
      description:
        'Crisp website ID of the MIDA inbox, found in the Crisp dashboard URL.',
      isSecret: false,
    },
    [CRISP_API_IDENTIFIER_BLOY_VARIABLE]: {
      universalIdentifier: CRISP_API_IDENTIFIER_BLOY_VARIABLE_UID,
      description: 'Crisp REST API identifier of the BLOY workspace.',
      isSecret: true,
    },
    [CRISP_API_KEY_BLOY_VARIABLE]: {
      universalIdentifier: CRISP_API_KEY_BLOY_VARIABLE_UID,
      description:
        'Crisp REST API key of the BLOY workspace, paired with the identifier above.',
      isSecret: true,
    },
    [CRISP_API_IDENTIFIER_MIDA_VARIABLE]: {
      universalIdentifier: CRISP_API_IDENTIFIER_MIDA_VARIABLE_UID,
      description: 'Crisp REST API identifier of the MIDA workspace.',
      isSecret: true,
    },
    [CRISP_API_KEY_MIDA_VARIABLE]: {
      universalIdentifier: CRISP_API_KEY_MIDA_VARIABLE_UID,
      description:
        'Crisp REST API key of the MIDA workspace, paired with the identifier above.',
      isSecret: true,
    },
    [CRISP_ENABLED_VARIABLE]: {
      universalIdentifier: CRISP_ENABLED_VARIABLE_UID,
      description:
        'Whether the Crisp sync runs. Turn off without touching its schedule.',
      type: FieldType.BOOLEAN,
      isSecret: false,
      value: true,
    },
  },
});

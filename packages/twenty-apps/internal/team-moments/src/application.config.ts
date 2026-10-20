import { defineApplication } from 'twenty-sdk/define';

import { PUBLIC_BASE_URL_VARIABLE } from './constants/application-variable-names';
import {
  APPLICATION_UID,
  PUBLIC_BASE_URL_VARIABLE_UID,
} from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Team Moments',
  description:
    'Countdowns for holidays, member birthdays and work anniversaries, with a chat room, a shared greeting card and a share link for every occasion.',
  applicationVariables: {
    [PUBLIC_BASE_URL_VARIABLE]: {
      universalIdentifier: PUBLIC_BASE_URL_VARIABLE_UID,
      label: 'Public server URL',
      description:
        'Origin the share links are opened from, with no trailing slash, e.g. https://crm.example.com. Link previews need absolute image URLs; left empty, the request host is used.',
      value: '',
    },
  },
});

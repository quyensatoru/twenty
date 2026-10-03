import { defineApplication } from 'twenty-sdk/define';

import {
  APPLICATION_UID,
  RECORD_PAGE_BASE_URL_VARIABLE_UID,
} from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Task Manager',
  description:
    'Jira-style issue tracking scoped by Shopify app: projects, sprints, epics, per-project statuses, worklogs and merchant links. Every read and write is filtered by the caller App Access grants.',
  applicationVariables: {
    RECORD_PAGE_BASE_URL: {
      universalIdentifier: RECORD_PAGE_BASE_URL_VARIABLE_UID,
      label: 'Front end base URL',
      description:
        'Origin this workspace is browsed at, with no trailing slash — https://crm.example.com. The copy-link buttons prefix it to the record path. Left empty they use the API server origin, which is right whenever the server also serves the front end; set it when the front end lives on another origin.',
      value: '',
    },
  },
});

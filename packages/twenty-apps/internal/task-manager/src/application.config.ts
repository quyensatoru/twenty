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
        'Origin this workspace is browsed at, with no trailing slash — https://crm.example.com. The copy-link buttons prefix it to the record path. Left empty they copy the path alone, because a front component runs in a sandboxed worker with an opaque origin and has no way to discover it.',
      value: '',
    },
  },
});

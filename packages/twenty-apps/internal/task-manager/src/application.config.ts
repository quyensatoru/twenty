import { defineApplication } from 'twenty-sdk/define';

import { APPLICATION_UID } from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Task Manager',
  description:
    'Jira-style issue tracking scoped by Shopify app: projects, sprints, epics, per-project statuses, worklogs and merchant links. Every read and write is filtered by the caller App Access grants.',
  applicationVariables: {},
});

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
  // OAuth client credentials for the Development git integrations. The server
  // administrator registers one OAuth App on GitHub and one on GitLab and
  // fills these in on the application registration; users then connect their
  // own git accounts under Settings → Applications → Task Manager.
  serverVariables: {
    GITHUB_CLIENT_ID: {
      description: 'OAuth client ID of the GitHub OAuth App.',
      isSecret: false,
      isRequired: false,
    },
    GITHUB_CLIENT_SECRET: {
      description: 'OAuth client secret of the GitHub OAuth App.',
      isSecret: true,
      isRequired: false,
    },
    GITLAB_CLIENT_ID: {
      description: 'OAuth application ID of the GitLab OAuth application.',
      isSecret: false,
      isRequired: false,
    },
    GITLAB_CLIENT_SECRET: {
      description: 'OAuth secret of the GitLab OAuth application.',
      isSecret: true,
      isRequired: false,
    },
    GITLAB_BASE_URL: {
      description:
        'Base URL of the GitLab instance (https://git.example.com, no trailing slash). Empty means gitlab.com.',
      isSecret: false,
      isRequired: false,
    },
    GITHUB_BASE_URL: {
      description:
        'Base URL of the GitHub instance (https://github.example.com, no trailing slash). Empty means github.com.',
      isSecret: false,
      isRequired: false,
    },
  },
});

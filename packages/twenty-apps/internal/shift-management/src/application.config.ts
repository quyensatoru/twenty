import { defineApplication } from 'twenty-sdk/define';

import { SHIFT_LEADER_EMAILS_VARIABLE } from './constants/application-variable-names';
import {
  APPLICATION_UID,
  SHIFT_LEADER_EMAILS_VARIABLE_UID,
} from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Shift Management',
  description:
    'Shift registration, check-in/check-out and the monthly attendance report for a 24/7 rota. Members register from a month calendar, punch in and out, hand over to the next shift, and reconcile their own hours at month end.',
  applicationVariables: {
    [SHIFT_LEADER_EMAILS_VARIABLE]: {
      universalIdentifier: SHIFT_LEADER_EMAILS_VARIABLE_UID,
      label: 'Leader / PO emails',
      description:
        'Comma-separated member emails treated as Leader/PO: they read every member report, register on behalf of others and edit punches. Workspace admins (WORKSPACE_MEMBERS permission) are always included. The fork read this from the role flag canUpdateAllObjectRecords, which an app cannot see.',
    },
  },
});

import { defineFrontComponent } from 'twenty-sdk/define';

import { ISSUE_ACTIVITY_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { IssueActivity } from './components/issue-activity-panel';

export default defineFrontComponent({
  universalIdentifier: ISSUE_ACTIVITY_FRONT_COMPONENT_UID,
  name: 'issue-activity',
  description:
    "Comments, worklogs and system history of an issue, written through the app's scoped routes.",
  component: IssueActivity,
});

import { defineFrontComponent } from 'twenty-sdk/define';

import { ISSUE_SUBTASKS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { IssueSubtasks } from './components/issue-subtasks-panel';

export default defineFrontComponent({
  universalIdentifier: ISSUE_SUBTASKS_FRONT_COMPONENT_UID,
  name: 'issue-subtasks',
  description:
    "An issue's parent and child issues, opened beside the record through the app's scoped routes.",
  component: IssueSubtasks,
});

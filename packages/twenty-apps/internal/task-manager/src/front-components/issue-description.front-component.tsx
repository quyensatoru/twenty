import { defineFrontComponent } from 'twenty-sdk/define';

import { ISSUE_DESCRIPTION_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { IssueDescription } from './components/issue-description-panel';

export default defineFrontComponent({
  universalIdentifier: ISSUE_DESCRIPTION_FRONT_COMPONENT_UID,
  name: 'issue-description',
  description:
    "An issue's description, edited as markdown and written through the app's scoped routes.",
  component: IssueDescription,
});

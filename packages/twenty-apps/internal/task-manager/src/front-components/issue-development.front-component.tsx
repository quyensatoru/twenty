import { defineFrontComponent } from 'twenty-sdk/define';

import { ISSUE_DEVELOPMENT_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { IssueDevelopment } from './components/issue-development-panel';

export default defineFrontComponent({
  universalIdentifier: ISSUE_DEVELOPMENT_FRONT_COMPONENT_UID,
  name: 'issue-development',
  description:
    "An issue's branches, commits and pull requests with its repository setup, through the app's scoped routes.",
  component: IssueDevelopment,
});

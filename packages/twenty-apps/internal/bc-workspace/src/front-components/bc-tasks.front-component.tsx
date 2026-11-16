import { defineFrontComponent } from 'twenty-sdk/define';

import { TASKS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { TaskPage } from './components/task-page';

export default defineFrontComponent({
  universalIdentifier: TASKS_FRONT_COMPONENT_UID,
  name: 'bc-tasks',
  description:
    'BC Task Management: personal manual and automatic BC tasks with created-date filters, priorities and outcomes, no due dates.',
  component: TaskPage,
});

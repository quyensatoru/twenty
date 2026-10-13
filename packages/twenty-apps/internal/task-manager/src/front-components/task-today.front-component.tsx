import { defineFrontComponent } from 'twenty-sdk/define';

import { TASK_TODAY_FRONT_COMPONENT_UID } from '../constants/task-today';
import { TaskToday } from './components/task-today';

export default defineFrontComponent({
  universalIdentifier: TASK_TODAY_FRONT_COMPONENT_UID,
  name: 'task-today',
  description:
    'A personal daily dashboard for work, deadlines and unread conversations.',
  component: TaskToday,
});

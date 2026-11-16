import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { TASK_DETAIL_ROUTE_PATH } from '../constants/route-paths';
import { TASK_DETAIL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type TaskDetailResult } from '../types/tasks';
import { requireString } from './utils/require-string.util';
import { runBcRoute } from './utils/run-bc-route.util';
import {
  buildTaskDetail,
  loadScopedTask,
} from './utils/task-detail-store.util';

const handler = async (event: RoutePayload<{ taskId?: string }>) =>
  runBcRoute(async ({ client, scope }) => {
    const task = await loadScopedTask({
      client,
      scope,
      taskId: requireString(event.body?.taskId, 'taskId'),
    });
    const result: TaskDetailResult = {
      task: await buildTaskDetail({ client, scope, task }),
    };

    return result;
  });

export default defineLogicFunction({
  universalIdentifier: TASK_DETAIL_LOGIC_FUNCTION_UID,
  name: 'bc-task-detail',
  description:
    'Route: one BC task with its history, linked issue, opportunity and client.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: TASK_DETAIL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});

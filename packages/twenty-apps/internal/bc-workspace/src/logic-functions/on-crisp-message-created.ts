import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import {
  type DatabaseEventPayload,
  enqueueJobs,
} from 'twenty-sdk/logic-function';

import {
  CLASSIFY_MESSAGE_JOB_LOGIC_FUNCTION_UID,
  ON_CRISP_MESSAGE_CREATED_LOGIC_FUNCTION_UID,
} from '../constants/universal-identifiers';
import {
  type CrispMessageNode,
  handleCrispMessage,
  readCrispMessage,
} from './utils/automation-crisp.util';
import { createAppClient } from './utils/create-app-client.util';
import { readBcSettings } from './utils/read-bc-settings.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<CrispMessageNode>>,
) => {
  const client = createAppClient();
  const message = await readCrispMessage(client, event.recordId);

  if (message === null) {
    return { outcome: 'ignored', reason: 'message not found' };
  }

  const result = await handleCrispMessage(client, message);

  if (
    result.outcome === 'client-message' &&
    result.shouldClassify &&
    readBcSettings().isAiIssueDetectionEnabled
  ) {
    // Queued: the model call is slow and its failure must not replay the
    // timeline write above.
    await enqueueJobs({
      logicFunctionUniversalIdentifier: CLASSIFY_MESSAGE_JOB_LOGIC_FUNCTION_UID,
      payloads: [{ messageId: message.id, vipClientId: result.vipClientId }],
      retryLimit: 2,
    });
  }

  return result;
};

export default defineLogicFunction({
  universalIdentifier: ON_CRISP_MESSAGE_CREATED_LOGIC_FUNCTION_UID,
  name: 'on-crisp-message-created',
  description:
    'Logs VIP client Crisp messages on the timeline, tracks BC replies awaiting an answer and queues AI issue detection.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'crispMessage.created',
  },
  handler,
});

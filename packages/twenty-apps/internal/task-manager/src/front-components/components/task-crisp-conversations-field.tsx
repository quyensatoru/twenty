import { t } from 'twenty-sdk/front-component';

import { type IssueCrispConversation } from '../hooks/use-issue-crisp-conversations';
import { DetailReadButton } from './task-detail-controls';
import { TaskRecordChip } from './task-record-chip';

type TaskCrispConversationsFieldProps = {
  conversations: IssueCrispConversation[];
  onOpenConversation?: (conversationId: string) => void;
};

const readConversationName = (conversation: IssueCrispConversation): string =>
  conversation.visitorName ??
  conversation.visitorEmail ??
  conversation.shopDomain ??
  t('Visitor');

// The chat behind each detail keeps the row honest about which product and
// whether the customer is still waiting, without opening it.
const readConversationDetail = (
  conversation: IssueCrispConversation,
): string | undefined => {
  const parts = [
    conversation.appName,
    conversation.status === 'RESOLVED'
      ? t('Resolved')
      : conversation.waitingSince !== null
        ? t('Waiting for reply')
        : null,
  ].filter((part): part is string => typeof part === 'string' && part !== '');

  return parts.length === 0 ? undefined : parts.join(' · ');
};

export const TaskCrispConversationsField = ({
  conversations,
  onOpenConversation,
}: TaskCrispConversationsFieldProps) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0,
      width: '100%',
    }}
  >
    {conversations.map((conversation) => (
      <DetailReadButton
        key={conversation.id}
        label={t('Open conversation')}
        isReadOnly={onOpenConversation === undefined}
        onOpen={() => onOpenConversation?.(conversation.id)}
      >
        <TaskRecordChip
          name={readConversationName(conversation)}
          detail={readConversationDetail(conversation)}
        />
      </DetailReadButton>
    ))}
  </div>
);

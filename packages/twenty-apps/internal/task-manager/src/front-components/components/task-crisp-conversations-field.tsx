import { t } from 'twenty-sdk/front-component';
import { IconMessage } from 'twenty-ui/icon';

import { type IssueCrispConversation } from '../hooks/use-issue-crisp-conversations';
import { DetailReadButton } from './task-detail-controls';
import { TaskSkeletonBar } from './task-skeleton';
import { TASK_TOKENS } from './task-tokens';

type TaskCrispConversationsFieldProps = {
  conversations: IssueCrispConversation[];
  isLoading?: boolean;
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
  isLoading = false,
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
    {isLoading ? (
      <div
        role="status"
        aria-label={t('Loading conversations')}
        aria-busy="true"
      >
        <TaskSkeletonBar width={120} height={20} />
      </div>
    ) : conversations.length === 0 ? (
      <span
        style={{ color: TASK_TOKENS.textTertiary, fontSize: 13, padding: '0 6px' }}
      >
        {t('No conversations')}
      </span>
    ) : (
      conversations.map((conversation) => (
        <DetailReadButton
          key={conversation.id}
          label={t('Open conversation')}
          isReadOnly={onOpenConversation === undefined}
          onOpen={() => onOpenConversation?.(conversation.id)}
        >
          <span
            title={`${readConversationName(conversation)} · ${readConversationDetail(conversation)}`}
            style={{
              alignItems: 'flex-start',
              display: 'flex',
              fontSize: 13,
              gap: 6,
              minWidth: 0,
            }}
          >
            <span style={{ display: 'inline-flex', flexShrink: 0, paddingTop: 2 }}>
              <IconMessage size={14} color={TASK_TOKENS.textTertiary} />
            </span>
            {/* Two lines: side by side, the name and the state both lost
                their ends in a 220px column. */}
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: TASK_TOKENS.textPrimary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {readConversationName(conversation)}
              </span>
              <span
                style={{
                  color: TASK_TOKENS.textTertiary,
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {readConversationDetail(conversation)}
              </span>
            </span>
          </span>
        </DetailReadButton>
      ))
    )}
  </div>
);

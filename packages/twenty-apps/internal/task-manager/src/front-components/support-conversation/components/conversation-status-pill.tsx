import { t } from 'twenty-sdk/front-component';

import { type CrispConversationStatus } from '../constants/crisp';
import { InboxPill } from './inbox-pill';
import { readTone } from './inbox-tokens';

const readStatus = (
  status: CrispConversationStatus,
): { label: string; color: string } =>
  ({
    PENDING: { label: t('Pending'), color: 'yellow' },
    UNRESOLVED: { label: t('Open'), color: 'blue' },
    RESOLVED: { label: t('Resolved'), color: 'green' },
  })[status];

export const ConversationStatusPill = ({
  status,
}: {
  status: CrispConversationStatus | null;
}) => {
  if (status === null) {
    return null;
  }

  const { label, color } = readStatus(status);

  return <InboxPill tone={readTone(color)}>{label}</InboxPill>;
};

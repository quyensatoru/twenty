import { t } from 'twenty-sdk/front-component';

import { type ReleaseNotificationStatus } from '../../../constants/release-notification';
import {
  TAG_COLORS,
  TASK_CIRCLE_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';

export const ReleaseStatusBadge = ({
  status,
}: {
  status: ReleaseNotificationStatus | null;
}) => {
  const isPublished = status === 'PUBLISHED';

  return (
    <span
      style={{
        alignItems: 'center',
        color: isPublished ? TAG_COLORS.green.text : TASK_TOKENS.textTertiary,
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        fontWeight: 500,
        gap: 5,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...TASK_CIRCLE_STYLE,
          background: isPublished ? TAG_COLORS.green.text : 'transparent',
          border: isPublished
            ? 'none'
            : `1.5px dashed ${TASK_TOKENS.textTertiary}`,
          boxSizing: 'border-box',
          height: 8,
          width: 8,
        }}
      />
      {isPublished ? t('Published') : t('Draft')}
    </span>
  );
};

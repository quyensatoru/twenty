import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconBell } from 'twenty-ui/icon';

import { DISCUSSION_ROUTE_PATH } from '../hooks/use-discussion-state';
import { postAppRoute } from '../utils/post-app-route.util';
import { buildIssueCommentUrl } from '../utils/build-record-url.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { readErrorText } from '../utils/read-error-text.util';
import { TaskButton } from './task-button';
import { TASK_TOKENS } from './task-tokens';

type DiscussionNotification = {
  id: string;
  issueId: string;
  commentId: string;
  actorId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};
type TaskDiscussionNotificationsProps = { isCompact?: boolean };
export const TaskDiscussionNotifications = ({
  isCompact = false,
}: TaskDiscussionNotificationsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DiscussionNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);
  const reload = useCallback(async () => {
    const generation = ++requestGeneration.current;
    try {
      const result = await postAppRoute<{
        success: true;
        notifications: DiscussionNotification[];
        unreadCount: number;
      }>(DISCUSSION_ROUTE_PATH, { action: 'notifications' });
      if (requestGeneration.current !== generation) return;
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setError(null);
    } catch (caught) {
      if (requestGeneration.current !== generation) return;
      setError(readErrorText(caught));
    }
  }, []);
  useEffect(() => {
    void reload();
    const interval = setInterval(() => void reload(), 10000);
    return () => clearInterval(interval);
  }, [reload]);
  return (
    <div style={{ position: 'relative' }}>
      <TaskButton
        title={t('Notifications')}
        onClick={() => {
          setIsOpen(!isOpen);
          void reload();
        }}
      >
        <IconBell size={14} /> {!isCompact && t('Notifications')}
        {unreadCount > 0 && (
          <span
            style={{
              fontSize: 11,
              minWidth: 16,
              height: 16,
              padding: '0 3px',
              background: TASK_TOKENS.accentSoft,
              color: TASK_TOKENS.accent,
              borderRadius: TASK_TOKENS.radiusExtraSmall,
            }}
          >
            {unreadCount}
          </span>
        )}
      </TaskButton>
      {isOpen && (
        <twenty-overlay
          offsetX={isCompact ? -288 : -190}
          offsetY={40}
          onClose={() => setIsOpen(false)}
        >
          <div
            role="region"
            aria-label={t('Discussion notifications')}
            style={{
              width: 320,
              maxWidth: 'calc(100vw - 32px)',
              boxSizing: 'border-box',
              boxShadow: TASK_TOKENS.shadowStrong,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              color: TASK_TOKENS.textPrimary,
              padding: 12,
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radius,
              maxHeight: 360,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontWeight: 500,
                paddingBottom: 12,
                borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                marginBottom: 8,
              }}
            >
              {t('Notifications')}
            </div>
            {error && <span role="alert">{error}</span>}
            {notifications.length === 0 && (
              <div
                style={{
                  padding: '20px 8px',
                  textAlign: 'center',
                  color: TASK_TOKENS.textTertiary,
                }}
              >
                {t('No notifications yet')}
              </div>
            )}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  borderRadius: TASK_TOKENS.radiusSmall,
                  background:
                    notification.readAt === null
                      ? TASK_TOKENS.backgroundSecondary
                      : 'transparent',
                  borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                }}
              >
                <a
                  style={{
                    color: TASK_TOKENS.textPrimary,
                    textDecoration: 'none',
                    lineHeight: '20px',
                    overflowWrap: 'anywhere',
                  }}
                  href={buildIssueCommentUrl({
                    baseUrl: readRecordPageBaseUrl(),
                    issueId: notification.issueId,
                    commentId: notification.commentId,
                  })}
                >
                  {notification.body.trim() || t('Open discussion message')}
                </a>
                {notification.readAt === null && (
                  <>
                    <span style={{ color: TASK_TOKENS.accent, fontSize: 11 }}>
                      {t('Unread')}
                    </span>
                    <TaskButton
                      variant="ghost"
                      size="small"
                      onClick={() => {
                        void postAppRoute(DISCUSSION_ROUTE_PATH, {
                          action: 'readNotification',
                          notificationId: notification.id,
                        })
                          .then(reload)
                          .catch((caught) => setError(readErrorText(caught)));
                      }}
                    >
                      {t('Mark as read')}
                    </TaskButton>
                  </>
                )}
              </div>
            ))}
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

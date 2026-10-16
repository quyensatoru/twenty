import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconBell } from 'twenty-ui/icon';

import { DISCUSSION_ROUTE_PATH } from '../hooks/use-discussion-state';
import { postAppRoute } from '../utils/post-app-route.util';
import { buildIssueCommentUrl } from '../utils/build-record-url.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { readErrorText } from '../utils/read-error-text.util';
import { stripTaskMentionMarkup } from '../utils/task-mention-markdown.util';
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
export const TaskDiscussionNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
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
  }, [reload]);
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `${t('Notifications')} · ${unreadCount}`
            : t('Notifications')
        }
        title={t('Notifications')}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          void reload();
        }}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
        style={{
          alignItems: 'center',
          background:
            isOpen || isTriggerHovered
              ? TASK_TOKENS.backgroundHover
              : 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radiusSmall,
          color: TASK_TOKENS.textSecondary,
          cursor: 'pointer',
          display: 'inline-flex',
          height: 28,
          justifyContent: 'center',
          position: 'relative',
          width: 28,
        }}
      >
        <IconBell size={16} />
        {unreadCount > 0 && (
          <span
            aria-hidden
            style={{
              alignItems: 'center',
              background: TASK_TOKENS.red,
              borderRadius: 8,
              boxShadow: `0 0 0 2px ${TASK_TOKENS.background}`,
              boxSizing: 'border-box',
              color: '#ffffff',
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 9.5,
              fontWeight: 700,
              height: 14,
              justifyContent: 'center',
              minWidth: 14,
              padding: '0 3px',
              position: 'absolute',
              right: 1,
              top: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <twenty-overlay
          offsetX={-292}
          offsetY={32}
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
                  {stripTaskMentionMarkup(notification.body.trim()) ||
                    t('Open discussion message')}
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

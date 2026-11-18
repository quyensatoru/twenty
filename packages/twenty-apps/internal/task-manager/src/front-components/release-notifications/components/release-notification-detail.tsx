import { useState } from 'react';
import { t, useLocale } from 'twenty-sdk/front-component';
import {
  IconArrowLeft,
  IconBook,
  IconEyeOff,
  IconExternalLink,
  IconPencil,
  IconSend,
} from 'twenty-ui/icon';

import {
  type ReleaseNotification,
  type ReleaseNotificationApp,
} from '../../../types/release-notification';
import { TaskActionMenu } from '../../components/task-action-menu';
import { TaskButton } from '../../components/task-button';
import { TaskIconButton } from '../../components/task-icon-button';
import { TaskRichTextPreview } from '../../components/task-rich-text-preview';
import {
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import {
  formatReleaseDate,
  formatReleaseTimestamp,
} from '../utils/format-release-date.util';
import { ReleaseCategoryTag } from './release-category-badge';
import { ReleaseStatusBadge } from './release-status-badge';

type ReleaseNotificationDetailProps = {
  release: ReleaseNotification;
  app: ReleaseNotificationApp | null;
  isMobile: boolean;
  onBack: () => void;
  onEdit: () => void;
  onTogglePublish: () => Promise<void>;
  onDelete: () => void;
};

export const ReleaseNotificationDetail = ({
  release,
  app,
  isMobile,
  onBack,
  onEdit,
  onTogglePublish,
  onDelete,
}: ReleaseNotificationDetailProps) => {
  const locale = useLocale();
  const [isToggling, setIsToggling] = useState(false);
  const isPublished = release.status === 'PUBLISHED';
  const canWrite = app?.canWrite === true;
  const canDelete = app?.canDelete === true;
  const markdown = release.content?.markdown ?? '';
  const docUrl = release.linkDoc?.primaryLinkUrl ?? '';
  const releaseDateLabel = formatReleaseDate(release.releaseDate, locale);
  const publishedAtLabel = formatReleaseTimestamp(release.publishedAt, locale);

  const togglePublish = async () => {
    setIsToggling(true);
    await onTogglePublish();
    setIsToggling(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
          boxSizing: 'border-box',
          display: 'flex',
          flexShrink: 0,
          gap: 8,
          minHeight: 44,
          padding: isMobile ? '6px 12px' : '6px 20px 6px 24px',
        }}
      >
        {isMobile && (
          <TaskIconButton label={t('Back to releases')} onClick={onBack}>
            <IconArrowLeft size={16} />
          </TaskIconButton>
        )}
        <ReleaseStatusBadge status={release.status} />
        <span style={{ flex: 1 }} />
        {canWrite && (
          <>
            <TaskButton size="compact" onClick={onEdit} title={t('Edit')}>
              <IconPencil size={14} />
              {!isMobile && t('Edit')}
            </TaskButton>
            <TaskButton
              size="compact"
              variant={isPublished ? 'secondary' : 'primary'}
              isDisabled={isToggling}
              onClick={() => void togglePublish()}
              title={isPublished ? t('Unpublish') : t('Publish')}
            >
              {isPublished ? <IconEyeOff size={14} /> : <IconSend size={14} />}
              {isPublished ? t('Unpublish') : t('Publish')}
            </TaskButton>
          </>
        )}
        {canDelete && (
          <TaskActionMenu
            label={t('Release actions')}
            items={[
              {
                key: 'delete',
                label: t('Delete release'),
                confirmLabel: t('Click again to delete'),
                isDanger: true,
                onSelect: onDelete,
              },
            ]}
          />
        )}
      </div>

      <div
        style={{
          ...TASK_THIN_SCROLLBAR_STYLE,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <article
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: TASK_TOKENS.fontFamily,
            gap: 16,
            margin: '0 auto',
            maxWidth: 760,
            padding: isMobile ? '20px 16px 40px' : '32px 40px 56px',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <ReleaseCategoryTag category={release.category} />
            {release.version ? (
              <span
                style={{
                  border: `1px solid ${TASK_TOKENS.border}`,
                  borderRadius: TASK_TOKENS.radiusExtraSmall,
                  color: TASK_TOKENS.textSecondary,
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 500,
                  lineHeight: '18px',
                  padding: '0 6px',
                }}
              >
                {release.version}
              </span>
            ) : null}
            {app !== null && (
              <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
                {app.name}
              </span>
            )}
          </div>

          <h1
            style={{
              color: TASK_TOKENS.textPrimary,
              fontSize: isMobile ? 20 : 24,
              fontWeight: 600,
              letterSpacing: -0.3,
              lineHeight: 1.25,
              margin: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {release.title || t('Untitled release')}
          </h1>

          <dl
            style={{
              columnGap: 24,
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              margin: 0,
              rowGap: 10,
            }}
          >
            <ReleaseMeta
              label={t('Release date')}
              value={releaseDateLabel === '' ? t('Not set') : releaseDateLabel}
            />
            <ReleaseMeta
              label={t('Published')}
              value={
                isPublished && publishedAtLabel !== ''
                  ? publishedAtLabel
                  : t('Not sent to the app yet')
              }
            />
          </dl>

          {docUrl !== '' && (
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                alignItems: 'center',
                alignSelf: 'flex-start',
                background: TASK_TOKENS.backgroundSecondary,
                border: `1px solid ${TASK_TOKENS.border}`,
                borderRadius: TASK_TOKENS.radius,
                boxSizing: 'border-box',
                color: TASK_TOKENS.textPrimary,
                display: 'flex',
                gap: 10,
                maxWidth: '100%',
                padding: '8px 12px',
                textDecoration: 'none',
              }}
            >
              <IconBook size={16} color={TASK_TOKENS.accent} />
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('Documentation')}
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
                  {docUrl}
                </span>
              </span>
              <IconExternalLink size={14} color={TASK_TOKENS.textTertiary} />
            </a>
          )}

          <div
            style={{
              borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
              color: TASK_TOKENS.textPrimary,
              fontSize: 14,
              lineHeight: 1.6,
              paddingTop: 16,
            }}
          >
            {markdown.trim() === '' ? (
              <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 13 }}>
                {t('No content yet.')}
              </span>
            ) : (
              <TaskRichTextPreview value={markdown} />
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

const ReleaseMeta = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
    <dt
      style={{
        color: TASK_TOKENS.textTertiary,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </dt>
    <dd style={{ color: TASK_TOKENS.textSecondary, fontSize: 13, margin: 0 }}>
      {value}
    </dd>
  </div>
);

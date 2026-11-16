import { type ReactNode, useState } from 'react';
import { enqueueSnackbar, t, useLocale } from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconCode,
  IconExternalLink,
  IconMessage,
  IconNotes,
  IconStar,
} from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';

import { CLIENT_SAVE_ROUTE_PATH } from '../../constants/route-paths';
import { type BcContextResult } from '../../types/bc-context';
import { type ClientDetailResult } from '../../types/dashboard';
import { useClientDetail } from '../hooks/use-client-detail';
import {
  openCrispConversation,
  openDeveloperIssue,
} from '../utils/client-navigation.util';
import { formatCurrency, formatDate, formatNumber } from '../utils/format.util';
import { OPTION_SETS, readOptionLabel } from '../utils/option-labels.util';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { BcPanelSection, BcSidePanel } from './bc-side-panel';
import {
  AppBadge,
  AppHealthTag,
  PriorityTag,
  RelationshipStatusTag,
  ReviewStateLabel,
  SubscriptionLifecycleTag,
  TaskStatusTag,
} from './bc-tags';
import { BC_TOKENS, spacing } from './bc-theme';
import { ClientActivityTimeline } from './client-activity-timeline';
import { ClientDeveloperTaskForm } from './client-developer-task-form';
import {
  AddReviewForm,
  LogActivityForm,
  LogIssueForm,
  ReviewLinkForm,
} from './client-forms';
import { ClientIssueList } from './client-issue-list';
import { ClientPicLabel, ClientPicSelect } from './client-pic';
import { displayGeneratedText } from '../utils/display-text.util';

type PanelForm = 'ACTIVITY' | 'ISSUE' | 'DEVELOPER_TASK' | 'REVIEW' | null;

export type ClientDetailPanelProps = {
  vipClientId: string;
  context: BcContextResult;
  width: number | string;
  onClose: () => void;
  onChanged: () => void;
};

const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ alignItems: 'center', display: 'flex', gap: spacing(3), minHeight: 28 }}>
    <span style={{ color: BC_TOKENS.textTertiary, flexShrink: 0, width: 120 }}>{label}</span>
    <span style={{ minWidth: 0 }}>{children}</span>
  </div>
);

const PanelSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3), padding: spacing(4) }}>
    {[70, 45, 90, 60, 80].map((widthPercent, index) => (
      <span
        key={index}
        style={{
          background: BC_TOKENS.backgroundTertiary,
          borderRadius: BC_TOKENS.radiusSmall,
          display: 'block',
          height: 14,
          width: `${widthPercent}%`,
        }}
      />
    ))}
  </div>
);

const AppsSection = ({ detail }: { detail: ClientDetailResult }) => {
  const locale = useLocale();

  return (
    <BcPanelSection title={t('Apps')}>
      {detail.client.apps.length === 0 ? (
        <span style={{ color: BC_TOKENS.textTertiary }}>
          {t('No app install is linked to this client yet.')}
        </span>
      ) : (
        detail.client.apps.map((app) => (
          <div
            key={app.merchantId}
            style={{
              border: `1px solid ${BC_TOKENS.borderLight}`,
              borderRadius: BC_TOKENS.radiusSmall,
              display: 'grid',
              gap: spacing(1.5),
              gridTemplateColumns: '1fr 1fr',
              padding: spacing(2),
            }}
          >
            <span style={{ alignItems: 'center', display: 'flex', gap: spacing(2) }}>
              <AppBadge appName={app.appName} />
              <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>{app.planLabel ?? '—'}</span>
            </span>
            <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <AppHealthTag value={app.health} />
            </span>
            <span
              style={{
                alignItems: 'center',
                color: BC_TOKENS.textSecondary,
                display: 'flex',
                flexWrap: 'wrap',
                fontSize: BC_TOKENS.fontSizeSm,
                gap: spacing(1.5),
              }}
            >
              <SubscriptionLifecycleTag value={app.lifecycle} />
              {app.installedAt !== null &&
                t('since {date}', { date: formatDate(app.installedAt, locale) })}
            </span>
            <span style={{ display: 'flex', fontSize: BC_TOKENS.fontSizeSm, justifyContent: 'flex-end' }}>
              <ReviewStateLabel value={app.review} />
            </span>
            {app.chat !== null && (
              <span
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  fontSize: BC_TOKENS.fontSizeSm,
                  gap: spacing(2),
                  gridColumn: '1 / -1',
                  minWidth: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (app.chat !== null) {
                      openCrispConversation(app.chat.conversationId);
                    }
                  }}
                  style={{ alignItems: 'center', background: 'transparent', border: 'none', color: BC_TOKENS.accent, cursor: 'pointer', display: 'inline-flex', flexShrink: 0, fontFamily: BC_TOKENS.fontFamily, fontSize: BC_TOKENS.fontSizeSm, gap: spacing(1), padding: 0 }}
                >
                  <IconMessage size={12} />
                  {t('View chat')}
                </button>
                {app.chat.crispUrl !== null && (
                  <a
                    href={app.chat.crispUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ alignItems: 'center', color: BC_TOKENS.accent, display: 'inline-flex', flexShrink: 0, gap: spacing(1) }}
                  >
                    <IconExternalLink size={12} />
                    {t('Open in Crisp')}
                  </a>
                )}
                {app.chat.preview !== null && (
                  <span style={{ color: BC_TOKENS.textTertiary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.chat.preview}
                  </span>
                )}
              </span>
            )}
            {app.usage !== null && (
              <span style={{ color: BC_TOKENS.textSecondary, fontSize: BC_TOKENS.fontSizeSm, gridColumn: '1 / -1' }}>
                {t('Usage {used} of {limit} this cycle ({cycle})', {
                  used: formatNumber(app.usage.used, locale),
                  limit: formatNumber(app.usage.limit, locale),
                  cycle: app.usage.cycle,
                })}
              </span>
            )}
          </div>
        ))
      )}
    </BcPanelSection>
  );
};

// Task Manager tickets opened from this client. Their completion never
// closes a client issue; only a BC confirmation does.
const DeveloperTasksSection = ({ detail }: { detail: ClientDetailResult }) => {
  const locale = useLocale();

  if (detail.developerTasks.length === 0) {
    return null;
  }

  return (
    <BcPanelSection title={t('Developer tasks')}>
      {detail.developerTasks.map((task) => (
        <div
          key={task.issueId}
          style={{ alignItems: 'center', display: 'flex', gap: spacing(2), minHeight: 28 }}
        >
          <IconCode size={14} color={BC_TOKENS.textTertiary} />
          <button
            type="button"
            onClick={() => openDeveloperIssue(task.issueId)}
            style={{ background: 'transparent', border: 'none', color: BC_TOKENS.accent, cursor: 'pointer', flex: 1, fontFamily: BC_TOKENS.fontFamily, fontSize: BC_TOKENS.fontSizeMd, minWidth: 0, overflow: 'hidden', padding: 0, textAlign: 'left', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {displayGeneratedText(task.title)}
          </button>
          {task.appName !== null && <AppBadge appName={task.appName} />}
          <span style={{ color: BC_TOKENS.textTertiary, flexShrink: 0, fontSize: BC_TOKENS.fontSizeSm }}>
            {formatDate(task.createdAt, locale)}
          </span>
        </div>
      ))}
    </BcPanelSection>
  );
};

const TasksSection = ({ detail }: { detail: ClientDetailResult }) => (
  <BcPanelSection title={t('Open tasks')}>
    {detail.openTasks.length === 0 ? (
      <span style={{ color: BC_TOKENS.textTertiary }}>{t('No open task for this client.')}</span>
    ) : (
      detail.openTasks.map((task) => (
        <div key={task.id} style={{ alignItems: 'center', display: 'flex', gap: spacing(2), minHeight: 28 }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayGeneratedText(task.title)}
          </span>
          <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
            {task.category === 'OTHER' && task.customCategory !== null
              ? task.customCategory
              : readOptionLabel(OPTION_SETS.taskCategory, task.category)}
          </span>
          <PriorityTag value={task.priority} />
          <TaskStatusTag value={task.status} />
        </div>
      ))
    )}
  </BcPanelSection>
);

const ReviewsSection = ({
  detail,
  vipClientId,
  onChanged,
}: {
  detail: ClientDetailResult;
  vipClientId: string;
  onChanged: () => void;
}) => {
  const locale = useLocale();
  const [linkingReviewId, setLinkingReviewId] = useState<string | null>(null);

  return (
    <BcPanelSection title={t('Reviews')}>
      {detail.reviews.length === 0 ? (
        <span style={{ color: BC_TOKENS.textTertiary }}>{t('No verified review yet.')}</span>
      ) : (
        detail.reviews.map((review) => (
          <div key={review.id} style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(2), minHeight: 28 }}>
            <AppBadge appName={review.appName} />
            <span aria-label={t('{rating} of 5 stars', { rating: review.rating ?? 0 })}>
              {'★'.repeat(review.rating ?? 0)}
            </span>
            <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
              {formatDate(review.publishedAt, locale)}
              {review.creditedName !== null && ` · ${t('credited to {name}', { name: review.creditedName })}`}
            </span>
            <span style={{ flex: 1 }} />
            {review.reviewUrl === null ? (
              detail.canEdit ? (
                <button
                  type="button"
                  onClick={() => setLinkingReviewId(review.id)}
                  style={{ background: 'none', border: 'none', color: BC_TOKENS.accent, cursor: 'pointer', fontFamily: BC_TOKENS.fontFamily, fontSize: BC_TOKENS.fontSizeSm, padding: 0 }}
                >
                  {t('Not linked · add link')}
                </button>
              ) : (
                <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
                  {t('Not linked')}
                </span>
              )
            ) : (
              <a href={review.reviewUrl} target="_blank" rel="noreferrer" style={{ alignItems: 'center', color: BC_TOKENS.accent, display: 'inline-flex', gap: spacing(1), fontSize: BC_TOKENS.fontSizeSm }}>
                <IconExternalLink size={12} />
                {t('Open review')}
              </a>
            )}
            {linkingReviewId === review.id && (
              <ReviewLinkForm
                vipClientId={vipClientId}
                reviewId={review.id}
                onDone={() => {
                  setLinkingReviewId(null);
                  onChanged();
                }}
                onCancel={() => setLinkingReviewId(null)}
              />
            )}
          </div>
        ))
      )}
    </BcPanelSection>
  );
};

export const ClientDetailPanel = ({
  vipClientId,
  context,
  width,
  onClose,
  onChanged,
}: ClientDetailPanelProps) => {
  const locale = useLocale();
  const { detail, error, reload } = useClientDetail(vipClientId);
  const [form, setForm] = useState<PanelForm>(null);
  const appNames =
    detail === null || detail.client.apps.length === 0
      ? context.appNames
      : detail.client.apps.map((app) => app.appName);

  const afterChange = () => {
    setForm(null);
    void reload();
    onChanged();
  };

  const reassign = async (picId: string | null) => {
    try {
      await postAppRoute(CLIENT_SAVE_ROUTE_PATH, { vipClientId, picId });
      void enqueueSnackbar({ message: t('PIC updated'), variant: 'success' });
      afterChange();
    } catch (saveError) {
      void enqueueSnackbar({ message: readErrorText(saveError), variant: 'error' });
    }
  };

  const formProps = { vipClientId, appNames, onDone: afterChange, onCancel: () => setForm(null) };

  return (
    <BcSidePanel
      title={detail?.client.name ?? t('Client')}
      aside={detail === null ? undefined : <RelationshipStatusTag value={detail.client.status} />}
      width={width}
      ariaLabel={t('Client profile')}
      onClose={onClose}
    >
      {error !== null && detail === null && (
        <div style={{ padding: spacing(4) }}>
          <Banner color="danger" variant="secondary">
            {error}
          </Banner>
        </div>
      )}
      {detail === null && error === null && <PanelSkeleton />}
      {detail !== null && (
        <>
          <BcPanelSection title={t('Client')}>
            <InfoRow label={t('Shopify domain')}>
              <span style={{ overflowWrap: 'anywhere' }}>{detail.client.shopDomain ?? '—'}</span>
            </InfoRow>
            <InfoRow label={t('PIC')}>
              {context.scope.canReassignPic ? (
                <ClientPicSelect
                  picId={detail.client.picId}
                  picName={detail.client.picName}
                  members={context.members}
                  onChange={(picId) => void reassign(picId)}
                  width={220}
                />
              ) : (
                <ClientPicLabel name={detail.client.picName} />
              )}
            </InfoRow>
            <InfoRow label={t('Last BC contact')}>
              {formatDate(detail.client.lastBcContactAt, locale)}
              {detail.client.lastBcContactByName !== null &&
                ` · ${detail.client.lastBcContactByName}`}
            </InfoRow>
            {detail.lifetimeRevenue !== undefined && (
              <InfoRow label={t('Lifetime revenue')}>
                {detail.lifetimeRevenue.status === 'AVAILABLE' ? (
                  <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>
                    {formatCurrency(detail.lifetimeRevenue.amount, detail.lifetimeRevenue.currency, locale)}
                  </span>
                ) : (
                  <span style={{ color: BC_TOKENS.textTertiary }}>
                    {t('Unavailable: no payment feed connected')}
                  </span>
                )}
              </InfoRow>
            )}
            {detail.client.notes !== null && (
              <InfoRow label={t('Notes')}>
                <span style={{ whiteSpace: 'pre-wrap' }}>{detail.client.notes}</span>
              </InfoRow>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1), paddingTop: spacing(1) }}>
              {detail.client.crispConversationId !== null && (
                <Button
                  variant="outline"
                  color="neutral"
                  size="sm"
                  startIcon={<IconMessage size={14} />}
                  onClick={() => openCrispConversation(detail.client.crispConversationId as string)}
                >
                  {t('View chat')}
                </Button>
              )}
              {detail.canEdit && (
                <>
                  <Button variant="outline" color="neutral" size="sm" startIcon={<IconNotes size={14} />} onClick={() => setForm('ACTIVITY')}>
                    {t('Log activity')}
                  </Button>
                  <Button variant="outline" color="neutral" size="sm" startIcon={<IconAlertTriangle size={14} />} onClick={() => setForm('ISSUE')}>
                    {t('Log issue')}
                  </Button>
                  <Button variant="outline" color="neutral" size="sm" startIcon={<IconCode size={14} />} onClick={() => setForm('DEVELOPER_TASK')}>
                    {t('Developer task')}
                  </Button>
                  <Button variant="outline" color="neutral" size="sm" startIcon={<IconStar size={14} />} onClick={() => setForm('REVIEW')}>
                    {t('Add review')}
                  </Button>
                </>
              )}
            </div>
            {form === 'ACTIVITY' && <LogActivityForm {...formProps} />}
            {form === 'ISSUE' && <LogIssueForm {...formProps} />}
            {form === 'REVIEW' && <AddReviewForm {...formProps} />}
            {form === 'DEVELOPER_TASK' && (
              <ClientDeveloperTaskForm
                vipClientId={vipClientId}
                clientName={detail.client.name}
                shopDomain={detail.client.shopDomain}
                apps={detail.client.apps}
                openIssues={detail.openIssues}
                onDone={afterChange}
                onCancel={() => setForm(null)}
              />
            )}
          </BcPanelSection>
          <BcPanelSection
            title={t('Open issues ({count})', { count: detail.openIssues.length })}
          >
            <ClientIssueList
              issues={detail.openIssues}
              canEdit={detail.canEdit}
              emptyLabel={t('No open issue.')}
              onChanged={afterChange}
            />
          </BcPanelSection>
          <AppsSection detail={detail} />
          <TasksSection detail={detail} />
          <DeveloperTasksSection detail={detail} />
          <ReviewsSection detail={detail} vipClientId={vipClientId} onChanged={afterChange} />
          <BcPanelSection title={t('Activity timeline')}>
            <ClientActivityTimeline activities={detail.activities} />
          </BcPanelSection>
          {detail.closedIssues.length > 0 && (
            <BcPanelSection title={t('Closed issues')}>
              <ClientIssueList
                issues={detail.closedIssues}
                canEdit={false}
                emptyLabel=""
                onChanged={afterChange}
              />
            </BcPanelSection>
          )}
        </>
      )}
    </BcSidePanel>
  );
};

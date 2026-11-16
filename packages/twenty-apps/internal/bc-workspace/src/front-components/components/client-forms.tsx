import { type ReactNode, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { Button } from 'twenty-ui/primitives/input';

import {
  ACTIVITY_LOG_ROUTE_PATH,
  ISSUE_CREATE_ROUTE_PATH,
  REVIEW_SAVE_ROUTE_PATH,
} from '../../constants/route-paths';
import {
  type ActivityTopic,
  type MeetingStatus,
} from '../../types/bc-records';
import { type ActivityLogRequest } from '../../types/dashboard';
import { readDirectReviewUrl } from '../../utils/automation-review.util';
import { OPTION_SETS, toSelectOptions } from '../utils/option-labels.util';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { BcSelect } from './bc-select';
import { BcField, BcTextArea, BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';

const NO_APP_VALUE = 'NONE';

const todayDate = (): string => new Date().toISOString().slice(0, 10);

const useSubmit = (onDone: () => void) => {
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (routePath: string, body: Record<string, unknown>, message: string) => {
    setIsSaving(true);

    try {
      await postAppRoute(routePath, body);
      void enqueueSnackbar({ message, variant: 'success' });
      onDone();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, submit };
};

export const ClientFormShell = ({
  title,
  children,
  submitLabel,
  isSaving,
  isSubmitDisabled,
  onSubmit,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  submitLabel: string;
  isSaving: boolean;
  isSubmitDisabled: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) => (
  <div
    style={{
      background: BC_TOKENS.backgroundSecondary,
      border: `1px solid ${BC_TOKENS.borderLight}`,
      borderRadius: BC_TOKENS.radius,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing(3),
      padding: spacing(3),
    }}
  >
    <span style={{ fontWeight: BC_TOKENS.fontWeightSemiBold }}>{title}</span>
    {children}
    <span style={{ display: 'flex', gap: spacing(2), justifyContent: 'flex-end' }}>
      <Button variant="ghost" color="neutral" size="sm" onClick={onCancel}>
        {t('Cancel')}
      </Button>
      <Button
        variant="solid"
        color="accent"
        size="sm"
        loading={isSaving}
        disabled={isSaving || isSubmitDisabled}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </span>
  </div>
);

const buildAppOptions = (appNames: string[], allowNone: boolean) => [
  ...(allowNone ? [{ value: NO_APP_VALUE, label: t('All apps') }] : []),
  ...appNames.map((appName) => ({ value: appName, label: appName })),
];

type FormProps = {
  vipClientId: string;
  appNames: string[];
  onDone: () => void;
  onCancel: () => void;
};

export const LogActivityForm = ({ vipClientId, appNames, onDone, onCancel }: FormProps) => {
  const [type, setType] = useState<ActivityLogRequest['type']>('MEETING');
  const [topic, setTopic] = useState<ActivityTopic>('GENERAL');
  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus>('COMPLETED');
  const [date, setDate] = useState(todayDate());
  const [appName, setAppName] = useState(NO_APP_VALUE);
  const [summary, setSummary] = useState('');
  const { isSaving, submit } = useSubmit(onDone);

  return (
    <ClientFormShell
      title={t('Log activity')}
      submitLabel={t('Save activity')}
      isSaving={isSaving}
      isSubmitDisabled={summary.trim().length === 0}
      onCancel={onCancel}
      onSubmit={() =>
        void submit(
          ACTIVITY_LOG_ROUTE_PATH,
          {
            vipClientId,
            type,
            topic,
            meetingStatus: type === 'MEETING' ? meetingStatus : null,
            occurredAt: date,
            summary: summary.trim(),
            appName: appName === NO_APP_VALUE ? null : appName,
          },
          t('Activity logged'),
        )
      }
    >
      <div style={{ display: 'grid', gap: spacing(3), gridTemplateColumns: '1fr 1fr' }}>
        <BcField label={t('Type')}>
          <BcSelect
            ariaLabel={t('Type')}
            value={type}
            onChange={(value) => setType(value as ActivityLogRequest['type'])}
            options={[
              { value: 'MEETING', label: t('Online meeting') },
              { value: 'EMAIL', label: t('Email') },
              { value: 'CALL', label: t('Phone call') },
              { value: 'REVIEW_REQUEST', label: t('Review request') },
              { value: 'NOTE', label: t('Internal note') },
            ]}
          />
        </BcField>
        <BcField label={t('Date')}>
          <BcTextInput type="date" value={date} onChange={setDate} ariaLabel={t('Date')} />
        </BcField>
        {type === 'MEETING' && (
          <BcField label={t('Meeting status')}>
            <BcSelect
              ariaLabel={t('Meeting status')}
              value={meetingStatus}
              onChange={(value) => setMeetingStatus(value as MeetingStatus)}
              options={toSelectOptions(OPTION_SETS.meetingStatus)}
            />
          </BcField>
        )}
        {type !== 'REVIEW_REQUEST' && (
          <BcField label={t('Topic')}>
            <BcSelect
              ariaLabel={t('Topic')}
              value={topic}
              onChange={(value) => setTopic(value as ActivityTopic)}
              options={toSelectOptions(OPTION_SETS.activityTopic)}
            />
          </BcField>
        )}
        <BcField label={t('App')}>
          <BcSelect
            ariaLabel={t('App')}
            value={appName}
            onChange={setAppName}
            options={buildAppOptions(appNames, true)}
          />
        </BcField>
      </div>
      <BcField
        label={t('Summary')}
        isRequired
        hint={
          topic === 'UPSELL'
            ? t('Upsell outreach logged before an upgrade is what credits the upgrade to you.')
            : undefined
        }
      >
        <BcTextArea
          value={summary}
          onChange={setSummary}
          ariaLabel={t('Summary')}
          placeholder={t('What was discussed? What was the outcome?')}
          maxLength={2500}
        />
      </BcField>
    </ClientFormShell>
  );
};

export const LogIssueForm = ({ vipClientId, appNames, onDone, onCancel }: FormProps) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [appName, setAppName] = useState(appNames[0] ?? NO_APP_VALUE);
  const { isSaving, submit } = useSubmit(onDone);

  return (
    <ClientFormShell
      title={t('Log issue')}
      submitLabel={t('Log issue')}
      isSaving={isSaving}
      isSubmitDisabled={title.trim().length === 0}
      onCancel={onCancel}
      onSubmit={() =>
        void submit(
          ISSUE_CREATE_ROUTE_PATH,
          {
            vipClientId,
            title: title.trim(),
            summary: summary.trim(),
            appNames: appName === NO_APP_VALUE ? [] : [appName],
          },
          t('Issue logged. The client is now At Risk until it is resolved.'),
        )
      }
    >
      <BcField label={t('Title')} isRequired>
        <BcTextInput value={title} onChange={setTitle} ariaLabel={t('Title')} maxLength={200} />
      </BcField>
      <BcField label={t('Affected app')}>
        <BcSelect
          ariaLabel={t('Affected app')}
          value={appName}
          onChange={setAppName}
          options={buildAppOptions(appNames, true)}
        />
      </BcField>
      <BcField label={t('Details')}>
        <BcTextArea value={summary} onChange={setSummary} ariaLabel={t('Details')} maxLength={2500} />
      </BcField>
    </ClientFormShell>
  );
};

export const AddReviewForm = ({ vipClientId, appNames, onDone, onCancel }: FormProps) => {
  const [appName, setAppName] = useState(appNames[0] ?? '');
  const [rating, setRating] = useState('5');
  const [publishedAt, setPublishedAt] = useState(todayDate());
  const [reviewUrl, setReviewUrl] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [body, setBody] = useState('');
  const { isSaving, submit } = useSubmit(onDone);
  const urlError =
    reviewUrl.trim().length > 0 && readDirectReviewUrl(reviewUrl) === null
      ? t('Use the link of the review itself (apps.shopify.com/<app>/reviews/<id>), not the app listing.')
      : null;

  return (
    <ClientFormShell
      title={t('Add verified review')}
      submitLabel={t('Save review')}
      isSaving={isSaving}
      isSubmitDisabled={appName.length === 0 || urlError !== null}
      onCancel={onCancel}
      onSubmit={() =>
        void submit(
          REVIEW_SAVE_ROUTE_PATH,
          {
            vipClientId,
            reviewId: null,
            appName,
            rating: Number(rating),
            publishedAt,
            reviewUrl: reviewUrl.trim() || null,
            reviewerName: reviewerName.trim() || null,
            body: body.trim() || null,
          },
          t('Review saved'),
        )
      }
    >
      <div style={{ display: 'grid', gap: spacing(3), gridTemplateColumns: '1fr 1fr' }}>
        <BcField label={t('App')} isRequired>
          <BcSelect
            ariaLabel={t('App')}
            value={appName}
            onChange={setAppName}
            options={buildAppOptions(appNames, false)}
          />
        </BcField>
        <BcField label={t('Rating')} isRequired>
          <BcSelect
            ariaLabel={t('Rating')}
            value={rating}
            onChange={setRating}
            options={['5', '4', '3', '2', '1'].map((value) => ({
              value,
              label: `${'★'.repeat(Number(value))} ${value}/5`,
            }))}
          />
        </BcField>
        <BcField label={t('Published on')} isRequired>
          <BcTextInput
            type="date"
            value={publishedAt}
            onChange={setPublishedAt}
            ariaLabel={t('Published on')}
            max={todayDate()}
          />
        </BcField>
        <BcField label={t('Reviewer name')}>
          <BcTextInput value={reviewerName} onChange={setReviewerName} ariaLabel={t('Reviewer name')} />
        </BcField>
      </div>
      <BcField
        label={t('Shopify review link')}
        error={urlError}
        hint={t('Leave empty when the direct link is not known; the review shows as Not linked.')}
      >
        <BcTextInput
          type="url"
          value={reviewUrl}
          onChange={setReviewUrl}
          ariaLabel={t('Shopify review link')}
          placeholder="https://apps.shopify.com/…/reviews/…"
          hasError={urlError !== null}
        />
      </BcField>
      <BcField label={t('Review text')}>
        <BcTextArea value={body} onChange={setBody} ariaLabel={t('Review text')} maxLength={5000} />
      </BcField>
    </ClientFormShell>
  );
};

// Adds the direct link to a review recorded without one.
export const ReviewLinkForm = ({
  vipClientId,
  reviewId,
  onDone,
  onCancel,
}: {
  vipClientId: string;
  reviewId: string;
  onDone: () => void;
  onCancel: () => void;
}) => {
  const [reviewUrl, setReviewUrl] = useState('');
  const { isSaving, submit } = useSubmit(onDone);
  const isValid = readDirectReviewUrl(reviewUrl) !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2), width: '100%' }}>
      <BcField
        label={t('Shopify review link')}
        error={
          reviewUrl.trim().length > 0 && !isValid
            ? t('Use the link of the review itself (apps.shopify.com/<app>/reviews/<id>), not the app listing.')
            : null
        }
      >
        <BcTextInput
          type="url"
          value={reviewUrl}
          onChange={setReviewUrl}
          ariaLabel={t('Shopify review link')}
          placeholder="https://apps.shopify.com/…/reviews/…"
        />
      </BcField>
      <span style={{ display: 'flex', gap: spacing(2), justifyContent: 'flex-end' }}>
        <Button variant="ghost" color="neutral" size="sm" onClick={onCancel}>
          {t('Cancel')}
        </Button>
        <Button
          variant="solid"
          color="accent"
          size="sm"
          loading={isSaving}
          disabled={isSaving || !isValid}
          onClick={() =>
            void submit(
              REVIEW_SAVE_ROUTE_PATH,
              { vipClientId, reviewId, reviewUrl: reviewUrl.trim() },
              t('Review link saved'),
            )
          }
        >
          {t('Save link')}
        </Button>
      </span>
    </div>
  );
};

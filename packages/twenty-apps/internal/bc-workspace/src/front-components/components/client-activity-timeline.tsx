import { type ReactNode } from 'react';
import { t, useLocale } from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconCheckbox,
  IconCode,
  IconCreditCard,
  IconHistory,
  IconMail,
  IconMessage,
  IconNotes,
  IconPhone,
  IconStar,
  IconUserCircle,
} from 'twenty-ui/icon';

import { type ActivityType } from '../../types/bc-records';
import { type ClientActivityItem } from '../../types/dashboard';
import { openDeveloperIssue } from '../utils/client-navigation.util';
import { formatDateTime } from '../utils/format.util';
import { formatRelativeTime } from '../utils/client-relative-time.util';
import { OPTION_SETS, readOptionLabel } from '../utils/option-labels.util';
import { BC_TOKENS, readColorScale, spacing } from './bc-theme';
import { displayGeneratedText } from '../utils/display-text.util';

const ICON_SIZE = 14;

const readActivityIcon = (type: ActivityType): ReactNode => {
  switch (type) {
    case 'CRISP_MESSAGE':
      return <IconMessage size={ICON_SIZE} />;
    case 'EMAIL':
      return <IconMail size={ICON_SIZE} />;
    case 'MEETING':
      return <IconCalendarEvent size={ICON_SIZE} />;
    case 'CALL':
      return <IconPhone size={ICON_SIZE} />;
    case 'NOTE':
      return <IconNotes size={ICON_SIZE} />;
    case 'REVIEW_REQUEST':
    case 'REVIEW':
      return <IconStar size={ICON_SIZE} />;
    case 'ISSUE_DETECTED':
    case 'ISSUE_UPDATED':
    case 'ISSUE_RESOLVED':
    case 'ISSUE_DISMISSED':
      return <IconAlertTriangle size={ICON_SIZE} />;
    case 'DEVELOPER_TASK':
      return <IconCode size={ICON_SIZE} />;
    case 'TASK':
      return <IconCheckbox size={ICON_SIZE} />;
    case 'PIC_CHANGE':
      return <IconUserCircle size={ICON_SIZE} />;
    case 'SUBSCRIPTION':
    case 'USAGE':
      return <IconCreditCard size={ICON_SIZE} />;
    default:
      return <IconHistory size={ICON_SIZE} />;
  }
};

const readTone = (type: ActivityType): string | null => {
  if (type === 'ISSUE_DETECTED' || type === 'ISSUE_UPDATED') {
    return 'red';
  }

  if (type === 'ISSUE_RESOLVED' || type === 'REVIEW') {
    return 'green';
  }

  return null;
};

export const ClientActivityTimeline = ({
  activities,
}: {
  activities: ClientActivityItem[];
}) => {
  const locale = useLocale();

  if (activities.length === 0) {
    return (
      <span style={{ color: BC_TOKENS.textTertiary }}>{t('No activity yet.')}</span>
    );
  }

  return (
    <ol style={{ display: 'flex', flexDirection: 'column', listStyle: 'none', margin: 0, padding: 0 }}>
      {activities.map((activity, index) => {
        const tone = readTone(activity.type);

        return (
          <li key={activity.id} style={{ display: 'flex', gap: spacing(3) }}>
            <span style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  alignItems: 'center',
                  background: tone === null ? BC_TOKENS.backgroundTertiary : readColorScale(tone).soft,
                  borderRadius: '50%',
                  color: tone === null ? BC_TOKENS.textSecondary : readColorScale(tone).ink,
                  display: 'inline-flex',
                  flexShrink: 0,
                  height: 24,
                  justifyContent: 'center',
                  width: 24,
                }}
                title={readOptionLabel(OPTION_SETS.activityType, activity.type)}
              >
                {readActivityIcon(activity.type)}
              </span>
              {index < activities.length - 1 && (
                <span style={{ background: BC_TOKENS.borderLight, flex: 1, minHeight: 12, width: 1 }} />
              )}
            </span>
            <span style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 2, minWidth: 0, paddingBottom: spacing(3) }}>
              <span style={{ fontWeight: BC_TOKENS.fontWeightMedium, overflowWrap: 'anywhere' }}>
                {displayGeneratedText(activity.title)}
              </span>
              {activity.summary !== null && activity.summary.length > 0 && (
                <span style={{ color: BC_TOKENS.textSecondary, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                  {activity.summary}
                </span>
              )}
              <span
                style={{ color: BC_TOKENS.textTertiary, display: 'flex', flexWrap: 'wrap', fontSize: BC_TOKENS.fontSizeSm, gap: spacing(2) }}
                title={formatDateTime(activity.occurredAt, locale)}
              >
                <span>{formatRelativeTime(activity.occurredAt, locale)}</span>
                {activity.actorName !== null && <span>{activity.actorName}</span>}
                {activity.appName !== null && <span>{activity.appName}</span>}
                {activity.meetingStatus !== null && (
                  <span>{readOptionLabel(OPTION_SETS.meetingStatus, activity.meetingStatus)}</span>
                )}
                {activity.sourceUrl !== null && activity.sourceUrl.length > 0 && (
                  <a href={activity.sourceUrl} target="_blank" rel="noreferrer" style={{ color: BC_TOKENS.accent }}>
                    {t('Source')}
                  </a>
                )}
                {activity.developerIssueId !== null && (
                  <button
                    type="button"
                    onClick={() => openDeveloperIssue(activity.developerIssueId as string)}
                    style={{ background: 'none', border: 'none', color: BC_TOKENS.accent, cursor: 'pointer', fontFamily: BC_TOKENS.fontFamily, fontSize: BC_TOKENS.fontSizeSm, padding: 0 }}
                  >
                    {t('Open developer task')}
                  </button>
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

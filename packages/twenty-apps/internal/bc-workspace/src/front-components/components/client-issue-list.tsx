import { useState } from 'react';
import { enqueueSnackbar, t, useLocale } from 'twenty-sdk/front-component';
import { IconCheck, IconExternalLink, IconMessage, IconSparkles, IconX } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Button } from 'twenty-ui/primitives/input';

import {
  ISSUE_DISMISS_ROUTE_PATH,
  ISSUE_RESOLVE_ROUTE_PATH,
} from '../../constants/route-paths';
import { type ClientIssueItem } from '../../types/dashboard';
import { openCrispConversation } from '../utils/client-navigation.util';
import { formatDate } from '../utils/format.util';
import { OPTION_SETS } from '../utils/option-labels.util';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { OptionTag, AppBadge } from './bc-tags';
import { BcTextInput } from './bc-text-input';
import { BC_TOKENS, readColorScale, spacing } from './bc-theme';

const IssueCard = ({
  issue,
  canEdit,
  onChanged,
}: {
  issue: ClientIssueItem;
  canEdit: boolean;
  onChanged: () => void;
}) => {
  const locale = useLocale();
  const [isDismissing, setIsDismissing] = useState(false);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isOpen = issue.status === 'OPEN';

  const close = async (routePath: string, body: Record<string, unknown>, message: string) => {
    setIsSaving(true);

    try {
      await postAppRoute(routePath, { issueId: issue.id, ...body });
      void enqueueSnackbar({ message, variant: 'success' });
      setIsDismissing(false);
      onChanged();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${BC_TOKENS.borderLight}`,
        borderLeft: `3px solid ${isOpen ? readColorScale('red').solid : BC_TOKENS.borderLight}`,
        borderRadius: BC_TOKENS.radiusSmall,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing(2),
        padding: spacing(3),
      }}
    >
      <span style={{ alignItems: 'flex-start', display: 'flex', gap: spacing(2), justifyContent: 'space-between' }}>
        <span style={{ fontWeight: BC_TOKENS.fontWeightMedium, overflowWrap: 'anywhere' }}>{issue.title}</span>
        <OptionTag options={OPTION_SETS.issueStatus} value={issue.status} />
      </span>
      <span style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(1.5) }}>
        {issue.source === 'AI' ? (
          <Tag color="purple" startIcon={<IconSparkles size={12} />}>
            {issue.confidence === null
              ? t('AI detected')
              : t('AI detected · {confidence}%', { confidence: Math.round(issue.confidence * 100) })}
          </Tag>
        ) : (
          <Tag color="gray">{t('Manual')}</Tag>
        )}
        {issue.appNames.map((appName) => (
          <AppBadge key={appName} appName={appName} />
        ))}
        <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
          {t('Detected {date}', { date: formatDate(issue.detectedAt, locale) })}
        </span>
      </span>
      {issue.summary !== null && (
        <span style={{ color: BC_TOKENS.textSecondary, whiteSpace: 'pre-wrap' }}>{issue.summary}</span>
      )}
      {issue.evidence.map((evidence, index) => (
        <span
          key={evidence.messageId ?? index}
          style={{
            background: BC_TOKENS.backgroundSecondary,
            borderRadius: BC_TOKENS.radiusSmall,
            color: BC_TOKENS.textSecondary,
            display: 'flex',
            flexDirection: 'column',
            fontSize: BC_TOKENS.fontSizeSm,
            gap: spacing(1),
            padding: spacing(2),
          }}
        >
          <span style={{ fontStyle: 'italic', overflowWrap: 'anywhere' }}>“{evidence.excerpt}”</span>
          <span style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(3) }}>
            {typeof evidence.conversationId === 'string' && evidence.conversationId.length > 0 && (
              <button
                type="button"
                onClick={() => openCrispConversation(evidence.conversationId as string)}
                style={{ alignItems: 'center', background: 'transparent', border: 'none', color: BC_TOKENS.accent, cursor: 'pointer', display: 'inline-flex', fontFamily: BC_TOKENS.fontFamily, fontSize: BC_TOKENS.fontSizeSm, gap: spacing(1), padding: 0 }}
              >
                <IconMessage size={12} />
                {t('Open conversation')}
              </button>
            )}
            {typeof evidence.url === 'string' && evidence.url.length > 0 && (
              <a href={evidence.url} target="_blank" rel="noreferrer" style={{ alignItems: 'center', color: BC_TOKENS.accent, display: 'inline-flex', gap: spacing(1) }}>
                <IconExternalLink size={12} />
                {t('Open source message')}
              </a>
            )}
          </span>
        </span>
      ))}
      {!isOpen && (
        <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
          {issue.status === 'RESOLVED'
            ? t('Confirmed resolved {date} by {name}', {
                date: formatDate(issue.resolvedAt, locale),
                name: issue.resolvedByName ?? '—',
              })
            : t('Dismissed {date}: {reason}', {
                date: formatDate(issue.resolvedAt, locale),
                reason: issue.dismissReason ?? '—',
              })}
        </span>
      )}
      {isOpen && canEdit && !isDismissing && (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(2) }}>
          <Button
            variant="outline"
            color="success"
            size="sm"
            loading={isSaving}
            disabled={isSaving}
            startIcon={<IconCheck size={14} />}
            onClick={() =>
              void close(ISSUE_RESOLVE_ROUTE_PATH, {}, t('Issue confirmed resolved'))
            }
          >
            {t('Confirm resolved')}
          </Button>
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            startIcon={<IconX size={14} />}
            onClick={() => setIsDismissing(true)}
          >
            {t('Dismiss false positive')}
          </Button>
        </span>
      )}
      {isOpen && canEdit && isDismissing && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
          <BcTextInput
            value={reason}
            onChange={setReason}
            ariaLabel={t('Why is this not an issue?')}
            placeholder={t('Why is this not an issue?')}
            maxLength={500}
          />
          <span style={{ display: 'flex', gap: spacing(2), justifyContent: 'flex-end' }}>
            <Button variant="ghost" color="neutral" size="sm" onClick={() => setIsDismissing(false)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="solid"
              color="danger"
              size="sm"
              loading={isSaving}
              disabled={isSaving || reason.trim().length === 0}
              onClick={() =>
                void close(
                  ISSUE_DISMISS_ROUTE_PATH,
                  { reason: reason.trim() },
                  t('Issue dismissed as false positive'),
                )
              }
            >
              {t('Dismiss')}
            </Button>
          </span>
        </span>
      )}
    </div>
  );
};

export const ClientIssueList = ({
  issues,
  canEdit,
  emptyLabel,
  onChanged,
}: {
  issues: ClientIssueItem[];
  canEdit: boolean;
  emptyLabel: string;
  onChanged: () => void;
}) =>
  issues.length === 0 ? (
    <span style={{ color: BC_TOKENS.textTertiary }}>{emptyLabel}</span>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} canEdit={canEdit} onChanged={onChanged} />
      ))}
    </div>
  );

import { useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { SEND_STATUS_LABELS } from '../../constants/send-status-labels';
import { LAUNCH_CAMPAIGN_ROUTE_PATH } from '../../constants/route-paths';
import { type AudienceFilter } from '../../types/audience-filter';
import { type CampaignActionButton } from '../../types/campaign-action-button';
import { type CampaignRow } from '../../types/campaign-row';
import { type EventNameSuggestion } from '../../types/event-name-suggestion';
import { type TemplateRow } from '../../types/template-row';
import { legacyTriggerForEventName } from '../../utils/legacy-trigger-for-event-name.util';
import { normalizeEventName } from '../../utils/normalize-event-name.util';
import { parseAudienceFilter } from '../../utils/parse-audience-filter.util';
import { resolveCampaignEventName } from '../../utils/resolve-campaign-event-name.util';
import {
  countCampaignSends,
  type CampaignSendStats,
} from '../utils/count-campaign-sends.util';
import { fromDatetimeLocalValue } from '../utils/from-datetime-local-value.util';
import { getCampaignActions } from '../utils/get-campaign-actions.util';
import { listEventNames } from '../utils/list-event-names.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { toDatetimeLocalValue } from '../utils/to-datetime-local-value.util';
import { updateCampaignDraft } from '../utils/update-campaign-draft.util';
import { AudienceFilterEditor } from './audience-filter-editor';
import { CampaignStatusBadge } from './campaign-status-badge';
import { EventNameField } from './event-name-field';
import { StudioButton } from './studio-button';
import { StudioCheckbox } from './studio-checkbox';
import { StudioField } from './studio-field';
import { StudioPanel } from './studio-panel';
import { StudioSelect } from './studio-select';
import { StudioTextInput } from './studio-text-input';
import { STUDIO_TOKENS } from './studio-tokens';

type CampaignEditorProps = {
  campaign: CampaignRow;
  templates: TemplateRow[];
  apps: { id: string; name: string }[];
  onBack: () => void;
  onChanged: () => Promise<void>;
  onOpenTemplate: (templateId: string) => void;
};

const LOCKED_STATUSES = new Set(['SENDING', 'SENT', 'CANCELED']);

export const CampaignEditor = ({
  campaign,
  templates,
  apps,
  onBack,
  onChanged,
  onOpenTemplate,
}: CampaignEditorProps) => {
  const [name, setName] = useState(campaign.name ?? '');
  const [eventName, setEventName] = useState(
    resolveCampaignEventName(campaign) ?? '',
  );
  const [eventSuggestions, setEventSuggestions] = useState<
    EventNameSuggestion[]
  >([]);
  const [isLoadingEventNames, setIsLoadingEventNames] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(
    String(campaign.delayMinutes ?? 0),
  );
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>(() =>
    parseAudienceFilter(campaign.audienceFilter),
  );
  const [templateId, setTemplateId] = useState(campaign.templateId ?? '');
  const [fromEmail, setFromEmail] = useState(campaign.fromEmail ?? '');
  const [replyTo, setReplyTo] = useState(campaign.replyTo ?? '');
  const [sendOncePerMerchant, setSendOncePerMerchant] = useState(
    campaign.sendOncePerMerchant !== false,
  );
  const [scheduledAt, setScheduledAt] = useState(
    toDatetimeLocalValue(campaign.scheduledAt),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<CampaignActionButton | null>(null);
  const [stats, setStats] = useState<CampaignSendStats | null>(null);

  const isAutomation = campaign.campaignType === 'AUTOMATION';
  const isLocked = LOCKED_STATUSES.has(campaign.status ?? 'DRAFT');

  const refreshStats = async () => {
    try {
      setStats(await countCampaignSends(campaign.id));
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    void refreshStats();
  }, [campaign.id, campaign.status]);

  useEffect(() => {
    if (campaign.campaignType !== 'AUTOMATION') {
      return;
    }

    const loadEventNames = async () => {
      setIsLoadingEventNames(true);

      try {
        setEventSuggestions(await listEventNames());
      } catch {
        setEventSuggestions([]);
      } finally {
        setIsLoadingEventNames(false);
      }
    };

    void loadEventNames();
  }, [campaign.campaignType]);

  const markDirty =
    <TValue,>(setter: (value: TValue) => void) =>
    (value: TValue) => {
      setter(value);
      setIsDirty(true);
    };

  const saveDraft = async () => {
    await updateCampaignDraft(campaign.id, {
      name: name.trim() || t('Untitled campaign'),
      // The legacy select is kept in step with the event name so a rollback
      // to the release before dynamic events still routes this campaign.
      trigger: isAutomation ? legacyTriggerForEventName(eventName) : null,
      eventName: isAutomation ? (normalizeEventName(eventName) ?? '') : '',
      delayMinutes: Math.max(0, Math.round(Number(delayMinutes) || 0)),
      audienceFilter,
      templateId: templateId === '' ? null : templateId,
      fromEmail: fromEmail.trim(),
      replyTo: replyTo.trim(),
      sendOncePerMerchant,
      scheduledAt: isAutomation ? null : fromDatetimeLocalValue(scheduledAt),
    });
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsBusy(true);

    try {
      await saveDraft();
      await onChanged();
      enqueueSnackbar({ message: t('Campaign saved'), variant: 'success' });
    } catch (error) {
      enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const runAction = async (button: CampaignActionButton) => {
    setPendingAction(null);
    setIsBusy(true);

    try {
      if (!isLocked) {
        await saveDraft();
      }

      await postAppRoute(LAUNCH_CAMPAIGN_ROUTE_PATH, {
        campaignId: campaign.id,
        action: button.action,
      });
      await onChanged();
      enqueueSnackbar({
        message: t('{action}: done', { action: t(button.label) }),
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const actions = getCampaignActions(campaign);
  const selectedTemplate = templates.find(
    (template) => template.id === templateId,
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
        overflow: 'auto',
      }}
    >
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <StudioButton variant="ghost" onClick={onBack}>
            ← {t('Campaigns')}
          </StudioButton>
          <CampaignStatusBadge status={campaign.status ?? 'DRAFT'} />
          <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
            {isAutomation ? t('Automation') : t('Broadcast')}
          </span>
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {isLocked ? null : (
            <StudioButton onClick={handleSave} isDisabled={isBusy || !isDirty}>
              {t('Save')}
            </StudioButton>
          )}
          {actions.map((button) => (
            <StudioButton
              key={button.action}
              variant={button.variant}
              isDisabled={isBusy}
              onClick={() =>
                button.needsConfirmation
                  ? setPendingAction(button)
                  : runAction(button)
              }
            >
              {t(button.label)}
            </StudioButton>
          ))}
        </div>
      </header>

      {pendingAction === null ? null : (
        <div
          style={{
            alignItems: 'center',
            background: STUDIO_TOKENS.accentSoft,
            border: `1px solid ${STUDIO_TOKENS.accent}`,
            borderRadius: STUDIO_TOKENS.radius,
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
            padding: '10px 12px',
          }}
        >
          <span style={{ color: STUDIO_TOKENS.textPrimary, fontSize: 13 }}>
            {pendingAction.action === 'SEND_NOW' ||
            pendingAction.action === 'RESUME'
              ? t(
                  'Emails start going out right away. Estimate the audience first if you have not.',
                )
              : pendingAction.action === 'ACTIVATE'
                ? t(
                    'From now on every matching merchant event sends this email.',
                  )
                : t('{action} this campaign?', {
                    action: t(pendingAction.label),
                  })}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <StudioButton
              variant="ghost"
              onClick={() => setPendingAction(null)}
            >
              {t('Back')}
            </StudioButton>
            <StudioButton
              variant={pendingAction.variant}
              onClick={() => runAction(pendingAction)}
            >
              {t('Confirm: {action}', { action: t(pendingAction.label) })}
            </StudioButton>
          </div>
        </div>
      )}

      {campaign.lastError ? (
        <div
          style={{
            border: `1px solid ${STUDIO_TOKENS.red}`,
            borderRadius: STUDIO_TOKENS.radius,
            color: STUDIO_TOKENS.textDanger,
            fontSize: 12,
            padding: '8px 12px',
          }}
        >
          Last error: {campaign.lastError}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
        <StudioPanel title={t('Setup')}>
          <StudioField label={t('Campaign name')}>
            <StudioTextInput value={name} onChange={markDirty(setName)} />
          </StudioField>
          {isAutomation ? (
            <>
              <EventNameField
                value={eventName}
                suggestions={eventSuggestions}
                isLoadingSuggestions={isLoadingEventNames}
                onChange={markDirty(setEventName)}
              />
              <StudioField
                label={t('Delay (minutes)')}
                hint={t(
                  '0 sends right away. 1440 = one day, 4320 = three days.',
                )}
              >
                <StudioTextInput
                  type="number"
                  value={delayMinutes}
                  onChange={markDirty(setDelayMinutes)}
                />
              </StudioField>
              <StudioCheckbox
                checked={sendOncePerMerchant}
                label={t('Send at most once per merchant')}
                onChange={markDirty(setSendOncePerMerchant)}
              />
            </>
          ) : (
            <StudioField
              label={t('Scheduled for')}
              hint={t('Only used by Schedule. Send now ignores it.')}
            >
              <StudioTextInput
                type="datetime-local"
                value={scheduledAt}
                onChange={markDirty(setScheduledAt)}
              />
            </StudioField>
          )}
          <StudioField label={t('Template')}>
            <div style={{ display: 'flex', gap: 6 }}>
              <StudioSelect
                value={templateId}
                options={[
                  { value: '', label: 'Pick a template' },
                  ...templates.map((template) => ({
                    value: template.id,
                    label: template.name || t('Untitled template'),
                  })),
                ]}
                onChange={markDirty(setTemplateId)}
              />
              {selectedTemplate === undefined ? null : (
                <StudioButton
                  variant="ghost"
                  onClick={() => onOpenTemplate(selectedTemplate.id)}
                >
                  {t('Edit')}
                </StudioButton>
              )}
            </div>
          </StudioField>
          {selectedTemplate === undefined ? null : (
            <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
              {t('Subject: {subject}', {
                subject: selectedTemplate.subject || t('No subject'),
              })}
            </span>
          )}
          <StudioField
            label={t('From')}
            hint={t(
              'Leave empty to use the app default. The domain must be verified in Resend.',
            )}
          >
            <StudioTextInput
              value={fromEmail}
              placeholder="MIDA Team <hello@mida.so>"
              onChange={markDirty(setFromEmail)}
            />
          </StudioField>
          <StudioField label={t('Reply-To')}>
            <StudioTextInput
              value={replyTo}
              placeholder="support@mida.so"
              onChange={markDirty(setReplyTo)}
            />
          </StudioField>
        </StudioPanel>

        <StudioPanel title={t('Audience')}>
          <AudienceFilterEditor
            filter={audienceFilter}
            apps={apps}
            isAutomation={isAutomation}
            onChange={markDirty(setAudienceFilter)}
          />
        </StudioPanel>

        <StudioPanel
          title={t('Results')}
          actions={
            <StudioButton variant="ghost" onClick={() => void refreshStats()}>
              {t('Refresh')}
            </StudioButton>
          }
        >
          <div
            style={{
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            }}
          >
            {(['SENT', 'FAILED', 'SKIPPED'] as const).map((status) => (
              <div
                key={status}
                style={{
                  background: STUDIO_TOKENS.backgroundSecondary,
                  border: `1px solid ${STUDIO_TOKENS.border}`,
                  borderRadius: STUDIO_TOKENS.radiusSmall,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: 10,
                }}
              >
                <span
                  style={{
                    color: STUDIO_TOKENS.textTertiary,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {t(SEND_STATUS_LABELS[status])}
                </span>
                <span
                  style={{
                    color: STUDIO_TOKENS.textPrimary,
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  {stats === null
                    ? '–'
                    : stats.counts[status].toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {stats !== null && stats.recentFailures.length > 0 ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <span
                style={{
                  color: STUDIO_TOKENS.textDanger,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {t('Recent failures')}
              </span>
              {stats.recentFailures.map((failure, index) => (
                <div
                  key={`${failure.to}-${failure.at ?? index}`}
                  style={{
                    borderTop: `1px solid ${STUDIO_TOKENS.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    padding: '6px 0',
                  }}
                >
                  <span
                    style={{
                      color: STUDIO_TOKENS.textPrimary,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {failure.to || t('Unknown recipient')}
                    {failure.at === null ? null : (
                      <span
                        style={{
                          color: STUDIO_TOKENS.textTertiary,
                          fontWeight: 400,
                        }}
                      >
                        {' · '}
                        {new Date(failure.at).toLocaleString()}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      color: STUDIO_TOKENS.textDanger,
                      fontSize: 12,
                    }}
                  >
                    {failure.error || t('Unknown error')}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
            {t(
              'Every message is logged under Email Marketing → Send log, and on the merchant record.',
            )}
          </span>
        </StudioPanel>
      </div>
    </div>
  );
};

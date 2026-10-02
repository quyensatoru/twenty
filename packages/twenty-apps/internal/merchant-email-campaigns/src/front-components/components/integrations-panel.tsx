import { useEffect, useState } from 'react';
import {
  copyToClipboard,
  enqueueSnackbar,
  t,
} from 'twenty-sdk/front-component';

import { PROVIDER_LABELS } from '../../constants/provider-labels';
import { type EventNameSuggestion } from '../../types/event-name-suggestion';
import { type IntegrationInfo } from '../../types/integration-info';
import { buildEventSenderSnippet } from '../../utils/build-event-sender-snippet.util';
import { fetchIntegrationInfo } from '../utils/fetch-integration-info.util';
import { listEventNames } from '../utils/list-event-names.util';
import { readErrorText } from '../utils/read-error-text.util';
import { StudioBadge } from './studio-badge';
import { StudioButton } from './studio-button';
import { StudioPanel } from './studio-panel';
import { STUDIO_TOKENS } from './studio-tokens';

const codeStyle = {
  background: STUDIO_TOKENS.backgroundTertiary,
  borderRadius: STUDIO_TOKENS.radiusSmall,
  color: STUDIO_TOKENS.textPrimary,
  fontFamily: 'var(--t-code-font-family, monospace)',
  fontSize: 12,
  margin: 0,
  overflow: 'auto',
  padding: 12,
  whiteSpace: 'pre',
} as const;

export const IntegrationsPanel = () => {
  const [info, setInfo] = useState<IntegrationInfo | null>(null);
  const [eventNames, setEventNames] = useState<EventNameSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);

    try {
      setInfo(await fetchIntegrationInfo());
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    }

    try {
      setEventNames(await listEventNames());
    } catch {
      setEventNames([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const copy = async (text: string, label: string) => {
    await copyToClipboard(text);
    enqueueSnackbar({
      message: t('{label} copied', { label }),
      variant: 'success',
    });
  };

  if (isLoading && info === null) {
    return (
      <p style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 13 }}>
        {t('Loading…')}
      </p>
    );
  }

  if (error !== null || info === null) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'flex-start',
        }}
      >
        <p style={{ color: STUDIO_TOKENS.textDanger, fontSize: 13, margin: 0 }}>
          {error}
        </p>
        <StudioButton onClick={() => void load()}>Retry</StudioButton>
      </div>
    );
  }

  const snippet = buildEventSenderSnippet(info.eventsUrl);
  // An automation bound to a name nothing ever posts is the one failure this
  // design can hide: it stays ACTIVE and simply never fires.
  const unheardEventNames = eventNames.filter(
    (eventName) =>
      !eventName.isBuiltIn &&
      eventName.automationCount > 0 &&
      eventName.receivedCount === 0,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StudioPanel
        title={t('Email provider')}
        actions={
          <StudioBadge
            label={info.providerError === null ? t('Ready') : t('Needs setup')}
            tone={info.providerError === null ? 'green' : 'red'}
          />
        }
      >
        <span style={{ color: STUDIO_TOKENS.textPrimary, fontSize: 13 }}>
          {t('Sending through {provider}.', {
            provider: t(PROVIDER_LABELS[info.provider]),
          })}
        </span>
        {info.providerError === null ? null : (
          <span style={{ color: STUDIO_TOKENS.textDanger, fontSize: 12 }}>
            {info.providerError}
          </span>
        )}
        <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
          {t(
            'Change it in Settings → Apps → Merchant Email Campaigns → Variables: EMAIL_PROVIDER, then RESEND_API_KEY or CUSTOM_EMAIL_ENDPOINT / CUSTOM_EMAIL_HEADERS / CUSTOM_EMAIL_BODY_TEMPLATE.',
          )}
        </span>
      </StudioPanel>

      <StudioPanel
        title={t('Events API')}
        actions={
          <StudioBadge
            label={info.isInboundKeySet ? t('Key set') : t('No key yet')}
            tone={info.isInboundKeySet ? 'green' : 'orange'}
          />
        }
      >
        <span style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 13 }}>
          {t(
            'Other apps post merchant events here in the same format as Brevo\'s POST /v3/events. Each event is matched to a merchant by DOMAIN (or email), updates the merchant\'s email, and sends every active automation bound to that event name. The name is free: an event nobody listens to yet is still logged, and the studio offers it next time.',
          )}
        </span>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <code style={{ ...codeStyle, flex: 1, padding: '8px 12px' }}>
            POST {info.eventsUrl}
          </code>
          <StudioButton onClick={() => void copy(info.eventsUrl, t('URL'))}>
            {t('Copy URL')}
          </StudioButton>
        </div>
        {info.isInboundKeySet ? null : (
          <span style={{ color: STUDIO_TOKENS.orange, fontSize: 12 }}>
            {t(
              'Set INBOUND_EVENTS_API_KEY in the app variables first; every call is refused until then.',
            )}
          </span>
        )}
        <pre style={codeStyle}>{snippet}</pre>
        <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
          {t(
            'Responses: 204 accepted · 400 invalid payload · 401 wrong key. Properties are available in templates as {{event.<key>}}, e.g. {{event.days_left}}.',
          )}
        </span>
        <div>
          <StudioButton onClick={() => void copy(snippet, t('Snippet'))}>
            {t('Copy snippet')}
          </StudioButton>
        </div>
      </StudioPanel>

      {unheardEventNames.length === 0 ? null : (
        <StudioPanel title={t('Automations waiting on an event never received')}>
          <span style={{ color: STUDIO_TOKENS.orange, fontSize: 13 }}>
            {t(
              'These names are spelled in an automation but no app has ever posted them. Either the sender is not live yet, or the name is a typo and that automation will never fire.',
            )}
          </span>
          {unheardEventNames.map((eventName) => (
            <div
              key={eventName.name}
              style={{
                alignItems: 'center',
                borderTop: `1px solid ${STUDIO_TOKENS.border}`,
                display: 'flex',
                gap: 8,
                justifyContent: 'space-between',
                padding: '8px 0',
              }}
            >
              <code style={{ ...codeStyle, padding: '2px 6px' }}>
                {eventName.name}
              </code>
              <StudioBadge
                label={t('{count} automations', {
                  count: eventName.automationCount,
                })}
                tone="orange"
              />
            </div>
          ))}
        </StudioPanel>
      )}

      <StudioPanel
        title={t('Recent events')}
        actions={
          <StudioButton
            variant="ghost"
            onClick={() => void load()}
            isDisabled={isLoading}
          >
            {t('Refresh')}
          </StudioButton>
        }
      >
        {info.recentEvents.length === 0 ? (
          <p
            style={{
              color: STUDIO_TOKENS.textSecondary,
              fontSize: 13,
              margin: 0,
            }}
          >
            {t('No event received yet.')}
          </p>
        ) : (
          info.recentEvents.map((event) => (
            <div
              key={event.id}
              style={{
                alignItems: 'center',
                borderTop: `1px solid ${STUDIO_TOKENS.border}`,
                display: 'grid',
                gap: 8,
                gridTemplateColumns:
                  'minmax(120px, 1fr) minmax(160px, 1.5fr) auto auto',
                padding: '8px 0',
              }}
            >
              <span
                style={{
                  color: STUDIO_TOKENS.textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {event.name}
              </span>
              <span
                style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 12 }}
              >
                {event.merchantName || event.domain || '—'} ·{' '}
                {event.email || t('no email')}
              </span>
              <StudioBadge
                label={
                  event.status === 'MATCHED'
                    ? t('{count} queued', { count: event.campaignsQueued })
                    : t('No merchant')
                }
                tone={event.status === 'MATCHED' ? 'green' : 'orange'}
              />
              <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
                {event.occurredAt
                  ? new Date(event.occurredAt).toLocaleString()
                  : ''}
              </span>
            </div>
          ))
        )}
      </StudioPanel>
    </div>
  );
};

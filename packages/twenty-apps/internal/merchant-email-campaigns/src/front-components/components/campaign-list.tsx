import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { EMPTY_AUDIENCE_FILTER } from '../../constants/empty-audience-filter';
import { MERCHANT_TRIGGER_OPTIONS } from '../../constants/merchant-trigger-options';
import { type CampaignRow } from '../../types/campaign-row';
import { type CampaignType } from '../../types/campaign-type';
import { type TemplateRow } from '../../types/template-row';
import { createCampaign } from '../utils/create-campaign.util';
import { deleteCampaign } from '../utils/delete-campaign.util';
import { readErrorText } from '../utils/read-error-text.util';
import { CampaignStatusBadge } from './campaign-status-badge';
import { StudioButton } from './studio-button';
import { StudioPanel } from './studio-panel';
import { STUDIO_TOKENS } from './studio-tokens';

type CampaignListProps = {
  campaigns: CampaignRow[];
  templates: TemplateRow[];
  onOpen: (campaignId: string) => void;
  onChanged: () => Promise<void>;
};

const describeCampaign = (campaign: CampaignRow, templates: TemplateRow[]) => {
  const templateName =
    templates.find((template) => template.id === campaign.templateId)?.name ??
    'no template';

  if (campaign.campaignType === 'AUTOMATION') {
    const triggerLabel =
      MERCHANT_TRIGGER_OPTIONS.find(
        (option) => option.value === campaign.trigger,
      )?.label ?? 'No trigger';
    const translatedTrigger = t(triggerLabel);
    const delay = campaign.delayMinutes ?? 0;

    const eventLabel =
      campaign.trigger === 'CUSTOM_EVENT' && campaign.eventName
        ? ` "${campaign.eventName}"`
        : '';

    return `${translatedTrigger}${eventLabel}${delay > 0 ? ` + ${t('{delay} min', { delay })}` : ''} · ${templateName}`;
  }

  return campaign.scheduledAt
    ? `${t('Scheduled {date}', { date: new Date(campaign.scheduledAt).toLocaleString() })} · ${templateName}`
    : `${t('One-off broadcast')} · ${templateName}`;
};

export const CampaignList = ({
  campaigns,
  templates,
  onOpen,
  onChanged,
}: CampaignListProps) => {
  const [isBusy, setIsBusy] = useState(false);

  const handleCreate = async (type: CampaignType) => {
    setIsBusy(true);

    try {
      const id = await createCampaign({
        name: type === 'AUTOMATION' ? t('New automation') : t('New broadcast'),
        campaignType: type,
        trigger: type === 'AUTOMATION' ? 'INSTALLED' : null,
        audienceFilter: {
          ...EMPTY_AUDIENCE_FILTER,
          installStatus: type === 'AUTOMATION' ? 'ANY' : 'INSTALLED',
        },
        templateId: templates[0]?.id ?? null,
      });

      await onChanged();
      onOpen(id);
    } catch (error) {
      enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (campaign: CampaignRow) => {
    setIsBusy(true);

    try {
      await deleteCampaign(campaign.id);
      await onChanged();
    } catch (error) {
      enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  const renderGroup = (
    type: CampaignType,
    title: string,
    emptyText: string,
  ) => {
    const items = campaigns.filter(
      (campaign) => (campaign.campaignType ?? 'AUTOMATION') === type,
    );

    return (
      <StudioPanel
        title={`${title} (${items.length})`}
        actions={
          <StudioButton
            variant="primary"
            isDisabled={isBusy}
            onClick={() => handleCreate(type)}
          >
            {type === 'AUTOMATION' ? t('New automation') : t('New broadcast')}
          </StudioButton>
        }
      >
        {items.length === 0 ? (
          <p
            style={{
              color: STUDIO_TOKENS.textSecondary,
              fontSize: 13,
              margin: 0,
            }}
          >
            {emptyText}
          </p>
        ) : (
          items.map((campaign) => (
            <div
              key={campaign.id}
              style={{
                alignItems: 'center',
                borderTop: `1px solid ${STUDIO_TOKENS.border}`,
                display: 'flex',
                gap: 8,
                padding: '10px 0',
              }}
            >
              <button
                type="button"
                onClick={() => onOpen(campaign.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                  <span
                    style={{
                      color: STUDIO_TOKENS.textPrimary,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {campaign.name || 'Untitled campaign'}
                  </span>
                  <CampaignStatusBadge status={campaign.status ?? 'DRAFT'} />
                </span>
                <span
                  style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}
                >
                  {describeCampaign(campaign, templates)}
                </span>
              </button>
              <StudioButton variant="ghost" onClick={() => onOpen(campaign.id)}>
                {t('Open')}
              </StudioButton>
              {campaign.status === 'DRAFT' || campaign.status === 'CANCELED' ? (
                <StudioButton
                  variant="danger"
                  isDisabled={isBusy}
                  onClick={() => handleDelete(campaign)}
                >
                  {t('Delete')}
                </StudioButton>
              ) : null}
            </div>
          ))
        )}
      </StudioPanel>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {renderGroup(
        'AUTOMATION',
        t('Automations'),
        t(
          'Send an email when a merchant installs, uninstalls or changes plan. Example: a win-back offer 3 days after uninstall.',
        ),
      )}
      {renderGroup(
        'BROADCAST',
        t('Broadcasts'),
        t(
          'Send one email to a segment right now or at a set time. Example: a feature announcement to every installed MIDA merchant.',
        ),
      )}
    </div>
  );
};

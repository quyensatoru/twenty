import { t } from 'twenty-sdk/front-component';
import { CAMPAIGN_STATUS_OPTIONS } from '../../constants/campaign-status-options';
import { type CampaignStatus } from '../../types/campaign-status';
import { type StudioBadgeTone } from '../../types/studio-badge-tone';
import { StudioBadge } from './studio-badge';

const STATUS_TONES: Record<CampaignStatus, StudioBadgeTone> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  PAUSED: 'orange',
  SCHEDULED: 'blue',
  SENDING: 'blue',
  SENT: 'green',
  CANCELED: 'red',
};

export const CampaignStatusBadge = ({ status }: { status: CampaignStatus }) => (
  <StudioBadge
    label={t(
      CAMPAIGN_STATUS_OPTIONS.find((option) => option.value === status)
        ?.label ?? status,
    )}
    tone={STATUS_TONES[status] ?? 'gray'}
  />
);

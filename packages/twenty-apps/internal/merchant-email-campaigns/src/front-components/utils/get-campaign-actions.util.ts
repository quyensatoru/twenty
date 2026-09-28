import { type CampaignActionButton } from '../../types/campaign-action-button';
import { type CampaignRow } from '../../types/campaign-row';

// Mirrors resolveCampaignTransition on the server; the server stays the one
// that decides, this only picks which buttons are worth showing.
export const getCampaignActions = (
  campaign: CampaignRow,
): CampaignActionButton[] => {
  const status = campaign.status ?? 'DRAFT';

  if (campaign.campaignType === 'AUTOMATION') {
    switch (status) {
      case 'DRAFT':
        return [
          {
            action: 'ACTIVATE',
            label: 'Activate',
            variant: 'primary',
            needsConfirmation: true,
          },
        ];
      case 'ACTIVE':
        return [
          {
            action: 'PAUSE',
            label: 'Pause',
            variant: 'secondary',
            needsConfirmation: false,
          },
        ];
      case 'PAUSED':
        return [
          {
            action: 'RESUME',
            label: 'Resume',
            variant: 'primary',
            needsConfirmation: true,
          },
          {
            action: 'CANCEL',
            label: 'Archive',
            variant: 'danger',
            needsConfirmation: true,
          },
        ];
      default:
        return [];
    }
  }

  switch (status) {
    case 'DRAFT':
      return [
        {
          action: 'SCHEDULE',
          label: 'Schedule',
          variant: 'secondary',
          needsConfirmation: true,
        },
        {
          action: 'SEND_NOW',
          label: 'Send now',
          variant: 'primary',
          needsConfirmation: true,
        },
      ];
    case 'SCHEDULED':
      return [
        {
          action: 'CANCEL',
          label: 'Cancel',
          variant: 'danger',
          needsConfirmation: true,
        },
        {
          action: 'SEND_NOW',
          label: 'Send now',
          variant: 'primary',
          needsConfirmation: true,
        },
      ];
    case 'SENDING':
      return [
        {
          action: 'PAUSE',
          label: 'Pause sending',
          variant: 'secondary',
          needsConfirmation: false,
        },
      ];
    case 'PAUSED':
      return [
        {
          action: 'CANCEL',
          label: 'Cancel',
          variant: 'danger',
          needsConfirmation: true,
        },
        {
          action: 'RESUME',
          label: 'Resume sending',
          variant: 'primary',
          needsConfirmation: true,
        },
      ];
    default:
      return [];
  }
};

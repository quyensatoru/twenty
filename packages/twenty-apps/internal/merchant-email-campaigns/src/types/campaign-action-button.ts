import { type CampaignAction } from './campaign-action';

export type CampaignActionButton = {
  action: CampaignAction;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  needsConfirmation: boolean;
};

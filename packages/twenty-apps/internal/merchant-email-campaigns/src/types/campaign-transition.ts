import { type CampaignStatus } from './campaign-status';

export type CampaignTransition =
  | { ok: true; nextStatus: CampaignStatus; startsBroadcast: boolean }
  | { ok: false; error: string };

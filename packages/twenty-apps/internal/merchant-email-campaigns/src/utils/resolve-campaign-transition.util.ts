import { type CampaignAction } from '../types/campaign-action';
import { type CampaignRow } from '../types/campaign-row';
import { type CampaignTransition } from '../types/campaign-transition';
import { resolveCampaignEventName } from './resolve-campaign-event-name.util';

// Every status change that can put mail in flight goes through here, so the
// rules live in one tested place instead of in the UI.
export const resolveCampaignTransition = ({
  campaign,
  action,
  now = new Date(),
}: {
  campaign: CampaignRow;
  action: CampaignAction;
  now?: Date;
}): CampaignTransition => {
  const status = campaign.status ?? 'DRAFT';
  const isAutomation = campaign.campaignType === 'AUTOMATION';
  const fail = (error: string): CampaignTransition => ({ ok: false, error });

  // An automation with no event name can never fire, so it is refused here
  // rather than sitting ACTIVE and silent.
  const readinessError = !campaign.templateId
    ? 'Pick a template first.'
    : isAutomation && resolveCampaignEventName(campaign) === null
      ? 'Pick or type the event this automation answers.'
      : null;

  switch (action) {
    case 'ACTIVATE':
      if (!isAutomation) return fail('Only automations can be activated.');
      if (readinessError) return fail(readinessError);
      if (status === 'ACTIVE') return fail('The automation is already active.');
      if (status === 'CANCELED')
        return fail('A canceled campaign cannot be reactivated.');

      return { ok: true, nextStatus: 'ACTIVE', startsBroadcast: false };
    case 'PAUSE':
      if (
        status !== 'ACTIVE' &&
        status !== 'SENDING' &&
        status !== 'SCHEDULED'
      ) {
        return fail(`A ${status.toLowerCase()} campaign cannot be paused.`);
      }

      return { ok: true, nextStatus: 'PAUSED', startsBroadcast: false };
    case 'RESUME':
      if (status !== 'PAUSED')
        return fail('Only a paused campaign can be resumed.');
      if (readinessError) return fail(readinessError);

      return isAutomation
        ? { ok: true, nextStatus: 'ACTIVE', startsBroadcast: false }
        : { ok: true, nextStatus: 'SENDING', startsBroadcast: true };
    case 'SEND_NOW':
      if (isAutomation)
        return fail('Automations send on merchant events, not on demand.');
      if (readinessError) return fail(readinessError);
      if (status !== 'DRAFT' && status !== 'SCHEDULED') {
        return fail(
          `A ${status.toLowerCase()} broadcast cannot be sent again.`,
        );
      }

      return { ok: true, nextStatus: 'SENDING', startsBroadcast: true };
    case 'SCHEDULE': {
      if (isAutomation) return fail('Automations cannot be scheduled.');
      if (readinessError) return fail(readinessError);
      if (status !== 'DRAFT' && status !== 'SCHEDULED') {
        return fail(`A ${status.toLowerCase()} broadcast cannot be scheduled.`);
      }

      const scheduledAt = campaign.scheduledAt
        ? new Date(campaign.scheduledAt)
        : null;

      if (scheduledAt === null || Number.isNaN(scheduledAt.getTime())) {
        return fail('Set a send date first.');
      }

      if (scheduledAt.getTime() <= now.getTime()) {
        return fail('The send date must be in the future.');
      }

      return { ok: true, nextStatus: 'SCHEDULED', startsBroadcast: false };
    }
    case 'CANCEL':
      if (status === 'SENT' || status === 'CANCELED') {
        return fail(`A ${status.toLowerCase()} campaign cannot be canceled.`);
      }

      return { ok: true, nextStatus: 'CANCELED', startsBroadcast: false };
    default:
      return fail('Unknown action.');
  }
};

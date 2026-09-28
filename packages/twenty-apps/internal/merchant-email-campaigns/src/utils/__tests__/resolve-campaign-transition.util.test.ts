import { describe, expect, it } from 'vitest';

import { resolveCampaignTransition } from '../resolve-campaign-transition.util';

const now = new Date('2026-09-28T10:00:00Z');
const broadcast = {
  id: 'c',
  campaignType: 'BROADCAST' as const,
  status: 'DRAFT' as const,
  templateId: 't',
};
const automation = {
  id: 'c',
  campaignType: 'AUTOMATION' as const,
  status: 'DRAFT' as const,
  templateId: 't',
  trigger: 'UNINSTALLED' as const,
};

describe('resolveCampaignTransition', () => {
  it('sends a ready broadcast', () => {
    expect(
      resolveCampaignTransition({
        campaign: broadcast,
        action: 'SEND_NOW',
        now,
      }),
    ).toEqual({
      ok: true,
      nextStatus: 'SENDING',
      startsBroadcast: true,
    });
  });

  it('refuses without a template', () => {
    expect(
      resolveCampaignTransition({
        campaign: { ...broadcast, templateId: null },
        action: 'SEND_NOW',
        now,
      }).ok,
    ).toBe(false);
  });

  it('refuses a schedule in the past', () => {
    const result = resolveCampaignTransition({
      campaign: { ...broadcast, scheduledAt: '2026-09-28T09:00:00Z' },
      action: 'SCHEDULE',
      now,
    });

    expect(result).toEqual({
      ok: false,
      error: 'The send date must be in the future.',
    });
  });

  it('never re-sends a finished broadcast', () => {
    expect(
      resolveCampaignTransition({
        campaign: { ...broadcast, status: 'SENT' },
        action: 'SEND_NOW',
        now,
      }).ok,
    ).toBe(false);
  });

  it('activates an automation and resumes it without a broadcast', () => {
    expect(
      resolveCampaignTransition({
        campaign: automation,
        action: 'ACTIVATE',
        now,
      }),
    ).toEqual({
      ok: true,
      nextStatus: 'ACTIVE',
      startsBroadcast: false,
    });
    expect(
      resolveCampaignTransition({
        campaign: { ...automation, status: 'PAUSED' },
        action: 'RESUME',
        now,
      }),
    ).toEqual({ ok: true, nextStatus: 'ACTIVE', startsBroadcast: false });
  });

  it('requires a trigger to activate', () => {
    expect(
      resolveCampaignTransition({
        campaign: { ...automation, trigger: null },
        action: 'ACTIVATE',
        now,
      }).ok,
    ).toBe(false);
  });

  it('requires an event name for a custom-event automation', () => {
    const custom = { ...automation, trigger: 'CUSTOM_EVENT' as const };

    expect(
      resolveCampaignTransition({ campaign: custom, action: 'ACTIVATE', now })
        .ok,
    ).toBe(false);
    expect(
      resolveCampaignTransition({
        campaign: { ...custom, eventName: 'trial_ending' },
        action: 'ACTIVATE',
        now,
      }).ok,
    ).toBe(true);
  });
});

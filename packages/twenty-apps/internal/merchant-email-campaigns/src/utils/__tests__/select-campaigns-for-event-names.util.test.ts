import { describe, expect, it } from 'vitest';

import { type CampaignRow } from '../../types/campaign-row';
import { buildEventNameQuery } from '../build-event-name-query.util';
import { selectCampaignsForEventNames } from '../select-campaigns-for-event-names.util';

const automation = (overrides: Partial<CampaignRow>): CampaignRow => ({
  id: 'c',
  campaignType: 'AUTOMATION',
  status: 'ACTIVE',
  ...overrides,
});

describe('selectCampaignsForEventNames', () => {
  it('matches whatever spelling either side used', () => {
    const campaigns = [
      automation({ id: 'a', eventName: 'Trial Ending' }),
      automation({ id: 'b', eventName: 'trial_ending' }),
    ];

    expect(
      selectCampaignsForEventNames(campaigns, ['  TRIAL_ENDING ']).map(
        (campaign) => campaign.id,
      ),
    ).toEqual(['a', 'b']);
  });

  it('sends every automation bound to one event', () => {
    const campaigns = [
      automation({ id: 'a', eventName: 'trial_ending' }),
      automation({ id: 'b', eventName: 'trial_ending' }),
      automation({ id: 'c', eventName: 'trial_started' }),
    ];

    expect(
      selectCampaignsForEventNames(campaigns, ['trial_ending']).map(
        (campaign) => campaign.id,
      ),
    ).toEqual(['a', 'b']);
  });

  it('matches nothing for an event no automation is bound to', () => {
    expect(
      selectCampaignsForEventNames(
        [automation({ eventName: 'trial_ending' })],
        ['feature_used'],
      ),
    ).toEqual([]);
  });

  it('never matches an automation with no event name', () => {
    expect(
      selectCampaignsForEventNames(
        [automation({ eventName: '  ' }), automation({ eventName: null })],
        ['trial_ending', ''],
      ),
    ).toEqual([]);
  });

  it('still routes a campaign left on the legacy trigger column', () => {
    expect(
      selectCampaignsForEventNames(
        [automation({ id: 'legacy', trigger: 'UNINSTALLED', eventName: '' })],
        ['merchant.uninstalled'],
      ).map((campaign) => campaign.id),
    ).toEqual(['legacy']);
  });

  it('ignores drafts, paused automations and broadcasts', () => {
    const campaigns = [
      automation({ id: 'draft', status: 'DRAFT', eventName: 'trial_ending' }),
      automation({
        id: 'paused',
        status: 'PAUSED',
        eventName: 'trial_ending',
      }),
      automation({
        id: 'broadcast',
        campaignType: 'BROADCAST',
        eventName: 'trial_ending',
      }),
    ];

    expect(selectCampaignsForEventNames(campaigns, ['trial_ending'])).toEqual(
      [],
    );
  });
});

describe('buildEventNameQuery', () => {
  it('asks for the canonical and the raw spelling', () => {
    expect(buildEventNameQuery(['Trial Ending'])).toEqual({
      eventNames: ['trial_ending', 'Trial Ending'],
      legacyTriggers: [],
    });
  });

  it('adds the legacy trigger for a built-in event', () => {
    expect(buildEventNameQuery(['merchant.installed'])).toEqual({
      eventNames: ['merchant.installed'],
      legacyTriggers: ['INSTALLED'],
    });
  });

  it('drops blank names so the filter is never empty-matching', () => {
    expect(buildEventNameQuery(['', '   '])).toEqual({
      eventNames: [],
      legacyTriggers: [],
    });
  });
});

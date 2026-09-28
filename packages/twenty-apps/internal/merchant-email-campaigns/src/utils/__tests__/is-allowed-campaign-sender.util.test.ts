import { describe, expect, it } from 'vitest';

import { isAllowedCampaignSender } from '../is-allowed-campaign-sender.util';

describe('isAllowedCampaignSender', () => {
  it('always allows members with the Applications permission', () => {
    expect(
      isAllowedCampaignSender({
        email: 'a@x.io',
        permissionFlags: ['APPLICATIONS'],
        allowedSenders: undefined,
      }),
    ).toBe(true);
  });

  it('matches the list case-insensitively', () => {
    expect(
      isAllowedCampaignSender({
        email: 'Ann@X.io',
        permissionFlags: [],
        allowedSenders: 'bob@x.io, ann@x.io',
      }),
    ).toBe(true);
    expect(
      isAllowedCampaignSender({
        email: 'eve@x.io',
        permissionFlags: [],
        allowedSenders: 'bob@x.io',
      }),
    ).toBe(false);
  });

  it('allows everyone with *', () => {
    expect(
      isAllowedCampaignSender({
        email: null,
        permissionFlags: [],
        allowedSenders: '*',
      }),
    ).toBe(true);
  });

  it('denies by default', () => {
    expect(
      isAllowedCampaignSender({
        email: 'a@x.io',
        permissionFlags: [],
        allowedSenders: '',
      }),
    ).toBe(false);
  });
});

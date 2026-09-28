import { describe, expect, it } from 'vitest';

import { getCampaignActions } from '../get-campaign-actions.util';

const actionsOf = (
  type: 'AUTOMATION' | 'BROADCAST',
  status: 'DRAFT' | 'ACTIVE' | 'SENT',
) =>
  getCampaignActions({ id: 'c', campaignType: type, status }).map(
    (button) => button.action,
  );

describe('getCampaignActions', () => {
  it('offers the right next step', () => {
    expect(actionsOf('AUTOMATION', 'DRAFT')).toEqual(['ACTIVATE']);
    expect(actionsOf('AUTOMATION', 'ACTIVE')).toEqual(['PAUSE']);
    expect(actionsOf('BROADCAST', 'DRAFT')).toEqual(['SCHEDULE', 'SEND_NOW']);
    expect(actionsOf('BROADCAST', 'SENT')).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';

import { buildAutomationJobId } from '../build-automation-job-id.util';

const base = { campaignId: 'c-1', merchantId: 'm-2', trigger: 'UNINSTALLED' };

describe('buildAutomationJobId', () => {
  it('only uses characters the queue accepts', () => {
    expect(buildAutomationJobId(base)).toMatch(/^[\w.-]+$/);
  });

  it('collapses events within the same minute only', () => {
    expect(buildAutomationJobId({ ...base, now: 60_000 })).toBe(
      buildAutomationJobId({ ...base, now: 119_999 }),
    );
    expect(buildAutomationJobId({ ...base, now: 60_000 })).not.toBe(
      buildAutomationJobId({ ...base, now: 120_000 }),
    );
  });
});

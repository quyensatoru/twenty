import { describe, expect, it } from 'vitest';

import { buildDealStageColumns } from '../deal-stage-columns';

describe('buildDealStageColumns', () => {
  it('should fill one column per app and leave the others empty', () => {
    expect(
      buildDealStageColumns([
        { targetApp: { name: 'BLOY' }, stage: 'DEMO' },
        { targetApp: { name: 'MIDA' }, stage: 'NOT_CONTACTED' },
      ]),
    ).toEqual({
      bloyStage: 'DEMO',
      midaStage: 'NOT_CONTACTED',
    });
  });

  it('should clear every column when there is no deal', () => {
    expect(buildDealStageColumns([])).toEqual({
      bloyStage: null,
      midaStage: null,
    });
  });

  it('should keep the furthest stage when one app has several deals', () => {
    expect(
      buildDealStageColumns([
        { targetApp: { name: 'BLOY' }, stage: 'REJECTED' },
        { targetApp: { name: 'BLOY' }, stage: 'OUTREACHED' },
      ]).bloyStage,
    ).toBe('REJECTED');
  });

  it('should normalise the app name casing', () => {
    expect(
      buildDealStageColumns([{ targetApp: { name: 'bloy' }, stage: 'DEMO' }])
        .bloyStage,
    ).toBe('DEMO');
  });

  it('should ignore a deal without a target app or stage', () => {
    expect(
      buildDealStageColumns([
        { targetApp: null, stage: 'DEMO' },
        { targetApp: { name: 'BLOY' }, stage: null },
      ]),
    ).toEqual({ bloyStage: null, midaStage: null });
  });

  it('should ignore a deal against a source-only app, which has no column', () => {
    expect(
      buildDealStageColumns([
        { targetApp: { name: 'EU' }, stage: 'DEMO' },
        { targetApp: { name: 'MIDA' }, stage: 'DEMO' },
      ]),
    ).toEqual({ bloyStage: null, midaStage: 'DEMO' });
  });

  it('should ignore an app that is not registered', () => {
    expect(
      buildDealStageColumns([
        { targetApp: { name: 'GHOST_APP' }, stage: 'DEMO' },
      ]),
    ).toEqual({ bloyStage: null, midaStage: null });
  });
});

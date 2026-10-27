import { describe, expect, it } from 'vitest';

import { DEFAULT_PRODUCT_BACKLOG_SETTINGS } from '../../constants/product-backlog';
import {
  type MoscowBucket,
  type ProductBacklogSettings,
  type ProductItem,
} from '../../types/product-backlog';
import {
  analyzeMoscowVotes,
  moscowTotal,
  readKanoCategory,
  readRiskValueQuadrant,
  readValueEffortQuadrant,
} from '../product-backlog/categorical-templates.util';
import {
  RICE_TEMPLATE,
  WSJF_TEMPLATE,
} from '../product-backlog/formula-templates.util';
import {
  findPrioritizationTemplate,
  formatTemplateScore,
  rankItemsByTemplate,
} from '../product-backlog/prioritization-templates.util';
import {
  computeCompetitorAdoptionFactor,
  readImplementationPhase,
  SAE_ICE_CAF_TEMPLATE,
} from '../product-backlog/sae-ice-caf-template.util';

const settings: ProductBacklogSettings = {
  ...DEFAULT_PRODUCT_BACKLOG_SETTINGS,
  competitors: [
    { id: 'bon', name: 'BON', type: 'DIRECT' },
    { id: 'casa', name: 'CASA', type: 'DIRECT' },
    { id: 'smile', name: 'Smile', type: 'INDIRECT' },
    { id: 'appstle', name: 'Appstle', type: 'INDIRECT' },
  ],
};
const context = { settings };

describe('SAE ICE × CAF', () => {
  it('matches the "Hyperlink button - open popup" row: CAF = 0.6375', () => {
    expect(
      computeCompetitorAdoptionFactor(
        { adoption: { bon: 'GOOD', casa: 'BASIC', smile: 'NO' } },
        settings,
      ),
    ).toBeCloseTo(0.6375, 6);
  });

  it('matches the "Custom CSS for Loyalty popup" row: CAF = 0.175', () => {
    expect(
      computeCompetitorAdoptionFactor(
        { adoption: { bon: 'NO', casa: 'NO', appstle: 'BASIC' } },
        settings,
      ),
    ).toBeCloseTo(0.175, 6);
  });

  it('falls back to ICE when no competitor is rated', () => {
    expect(
      SAE_ICE_CAF_TEMPLATE.compute(
        { impact: 5, confidence: 4, ease: 3 },
        context,
      ),
    ).toBe(60);
  });

  it('boosts by at most 130%: ICE 1000 × 2.3 = 2300', () => {
    expect(
      SAE_ICE_CAF_TEMPLATE.compute(
        {
          impact: 10,
          confidence: 10,
          ease: 10,
          adoption: { bon: 'ADVANCED', casa: 'ADVANCED' },
        },
        context,
      ),
    ).toBeCloseTo(2300);
  });

  it('is unscored when an input is missing', () => {
    expect(
      SAE_ICE_CAF_TEMPLATE.compute({ impact: 5, confidence: 4 }, context),
    ).toBeNull();
  });

  it('splits phases at >300, 200–300, 100–<200 and <100', () => {
    expect(readImplementationPhase(300.1, settings).order).toBe(1);
    expect(readImplementationPhase(300, settings).order).toBe(2);
    expect(readImplementationPhase(200, settings).order).toBe(2);
    expect(readImplementationPhase(199.9, settings).order).toBe(3);
    expect(readImplementationPhase(100, settings).order).toBe(3);
    expect(readImplementationPhase(99, settings).order).toBe(4);
  });
});

describe('MoSCoW', () => {
  const stakeholderIds = ['s1', 's2', 's3', 's4', 's5'];
  const vote = (...buckets: MoscowBucket[]) => ({
    votes: Object.fromEntries(
      buckets.map((bucket, index) => [stakeholderIds[index], bucket]),
    ),
  });

  it('totals Feature 2 at 43 points and Feature 6 at 23', () => {
    expect(moscowTotal(vote('M', 'M', 'M', 'C', 'M'), settings)).toBe(43);
    expect(moscowTotal(vote('C', 'M', 'W', 'M', 'W'), settings)).toBe(23);
  });

  it('flags tied totals and stakeholders who vote everything the same', () => {
    const items = [
      { id: 'f3', inputs: vote('M', 'M', 'M', 'W', 'S') },
      { id: 'f7', inputs: vote('S', 'M', 'M', 'C', 'S') },
      { id: 'f6', inputs: vote('C', 'M', 'W', 'M', 'W') },
    ];
    const analysis = analyzeMoscowVotes(items, settings);

    expect(analysis.ties).toEqual([{ total: 37, ids: ['f3', 'f7'] }]);
    expect(analysis.flatVoterIds).toEqual(['s2']);
  });
});

describe('WSJF', () => {
  it('New Quickstart: (3+1+1)/1 = 5', () => {
    expect(
      WSJF_TEMPLATE.compute(
        { businessValue: 3, timeCriticality: 1, riskReduction: 1, jobSize: 1 },
        context,
      ),
    ).toBe(5);
  });

  it('DevOps: (1+2+2)/2 = 2.5', () => {
    expect(
      WSJF_TEMPLATE.compute(
        { businessValue: 1, timeCriticality: 2, riskReduction: 2, jobSize: 2 },
        context,
      ),
    ).toBe(2.5);
  });

  it('Mobile: risk adds to Job Size, (2+3+3)/(5+2)', () => {
    expect(
      WSJF_TEMPLATE.compute(
        {
          businessValue: 2,
          timeCriticality: 3,
          riskReduction: 3,
          jobSize: 5,
          risk: 2,
        },
        context,
      ),
    ).toBeCloseTo(8 / 7);
  });
});

describe('other templates', () => {
  it('scores RICE as R × I × C% / E', () => {
    expect(
      RICE_TEMPLATE.compute(
        { reach: 200, impact: 2, confidence: 80, effort: 2 },
        context,
      ),
    ).toBe(160);
  });

  it('orders the Risk / Value quadrants', () => {
    expect(readRiskValueQuadrant(8, 8).order).toBe(1);
    expect(readRiskValueQuadrant(8, 2).order).toBe(2);
    expect(readRiskValueQuadrant(2, 2).order).toBe(3);
    expect(readRiskValueQuadrant(2, 8).order).toBe(4);
  });

  it('calls high value and low effort a quick win', () => {
    expect(readValueEffortQuadrant(9, 2).label).toBe('Quick win');
  });

  it('reads the Kano table', () => {
    expect(
      readKanoCategory({ functional: 'LIKE', dysfunctional: 'DISLIKE' }),
    ).toBe('PERFORMANCE');
    expect(
      readKanoCategory({ functional: 'EXPECT', dysfunctional: 'DISLIKE' }),
    ).toBe('MUST');
    expect(
      readKanoCategory({ functional: 'LIKE', dysfunctional: 'NEUTRAL' }),
    ).toBe('ATTRACTIVE');
  });
});

describe('registry', () => {
  it('falls back to SAE ICE × CAF for an unknown id', () => {
    expect(findPrioritizationTemplate('nope').id).toBe('sae-ice-caf');
    expect(findPrioritizationTemplate('wsjf').id).toBe('wsjf');
  });

  it('ranks by score, then unscored items by position', () => {
    const items: ProductItem[] = [
      { id: 'unscored-late', position: 3 },
      {
        id: 'low',
        position: 0,
        priorityScores: { ice: { impact: 1, confidence: 1, ease: 1 } },
      },
      { id: 'unscored-early', position: 1 },
      {
        id: 'high',
        position: 2,
        priorityScores: { ice: { impact: 5, confidence: 5, ease: 5 } },
      },
    ];
    const ranked = rankItemsByTemplate(
      items,
      findPrioritizationTemplate('ice'),
      settings,
    );

    expect(ranked.map(({ item }) => item.id)).toEqual([
      'high',
      'low',
      'unscored-early',
      'unscored-late',
    ]);
  });

  it('formats a missing score as a dash', () => {
    expect(formatTemplateScore(SAE_ICE_CAF_TEMPLATE, null)).toBe('—');
    expect(formatTemplateScore(SAE_ICE_CAF_TEMPLATE, 1234.56)).toBe('1,234.6');
  });
});

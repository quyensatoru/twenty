import { describe, expect, it } from 'vitest';

import { DEFAULT_PRODUCT_BACKLOG_SETTINGS } from '../../constants/product-backlog';
import {
  readProductBacklogMigratedAt,
  readProductBacklogSettings,
} from '../read-product-backlog-settings.util';

describe('readProductBacklogSettings', () => {
  it('falls back to the defaults for missing or malformed JSON', () => {
    expect(readProductBacklogSettings(null)).toEqual(
      DEFAULT_PRODUCT_BACKLOG_SETTINGS,
    );
    expect(readProductBacklogSettings('broken')).toEqual(
      DEFAULT_PRODUCT_BACKLOG_SETTINGS,
    );
  });

  it('keeps valid entries and drops malformed ones', () => {
    const settings = readProductBacklogSettings({
      goals: [
        { id: 'g1', name: 'Grow paid plans', color: 'green' },
        { id: 'g2' },
      ],
      competitors: [{ id: 'c1', name: 'Rival', type: 'INDIRECT' }],
      competitorWeights: { DIRECT: 2 },
      activeTemplateId: 'wsjf',
    });

    expect(settings.goals).toEqual([
      { id: 'g1', name: 'Grow paid plans', color: 'green' },
    ]);
    expect(settings.competitors).toEqual([
      { id: 'c1', name: 'Rival', type: 'INDIRECT' },
    ]);
    expect(settings.competitorWeights).toEqual({ DIRECT: 2, INDIRECT: 1 });
    expect(settings.activeTemplateId).toBe('wsjf');
    expect(settings.readinessCriteria).toEqual(
      DEFAULT_PRODUCT_BACKLOG_SETTINGS.readinessCriteria,
    );
  });

  it('reads the migration marker apart from the settings', () => {
    expect(readProductBacklogMigratedAt({ migratedAt: '2026-10-26' })).toBe(
      '2026-10-26',
    );
    expect(readProductBacklogMigratedAt({})).toBeNull();
  });
});

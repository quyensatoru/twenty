import { describe, expect, it } from 'vitest';

import { buildDrilldownTable } from '../analytics-drilldown.util';
import { computeAnalytics } from '../analytics-metrics.util';
import { buildClient, buildDataset, buildTask } from './analytics-fixtures';

describe('buildDrilldownTable', () => {
  it('shows Completed or Not completed apart from the status, reconciling with the KPI (UAT-19)', () => {
    const { records, kpis } = computeAnalytics(
      buildDataset({
        tasks: [
          buildTask({ id: 'todo' }),
          buildTask({ id: 'progress', status: 'IN_PROGRESS' }),
          buildTask({ id: 'cancelled', status: 'CANCELLED' }),
          buildTask({
            id: 'done',
            status: 'COMPLETED',
            completedAt: '2026-10-09T00:00:00.000Z',
          }),
        ],
      }),
    );
    const table = buildDrilldownTable({
      metricKey: 'tasksCreated',
      records,
      finance: null,
      clients: [buildClient({})],
      memberNames: new Map([['tom', 'Tom Hoang']]),
      activities: [],
    });

    expect(table.rows).toHaveLength(kpis.tasksCreated?.value ?? -1);
    expect(
      Object.fromEntries(
        table.rows.map((row) => [
          row.id,
          [row.cells.status, row.cells.completion],
        ]),
      ),
    ).toEqual({
      todo: ['TODO', 'Not completed'],
      progress: ['IN_PROGRESS', 'Not completed'],
      cancelled: ['CANCELLED', 'Not completed'],
      done: ['COMPLETED', 'Completed'],
    });
  });

  it('refuses financial drilldowns without finance access (UAT-25)', () => {
    const { records } = computeAnalytics(buildDataset({}));

    expect(() =>
      buildDrilldownTable({
        metricKey: 'portfolioLifetimeRevenue',
        records,
        finance: null,
        clients: [],
        memberNames: new Map(),
        activities: [],
      }),
    ).toThrow();
  });
});

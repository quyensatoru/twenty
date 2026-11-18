import { describe, expect, it } from 'vitest';

import { type ReleaseNotification } from '../../../../types/release-notification';
import { groupReleasesByMonth } from '../group-releases-by-month.util';

const buildRelease = (
  id: string,
  releaseDate: string | null,
): ReleaseNotification => ({
  id,
  title: id,
  content: null,
  category: 'NEW',
  releaseDate,
  linkDoc: null,
  version: null,
  status: 'DRAFT',
  publishedAt: null,
  appId: 'app',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
});

describe('groupReleasesByMonth', () => {
  it('keeps undated releases in their own leading group and splits by month', () => {
    const groups = groupReleasesByMonth([
      buildRelease('undated', null),
      buildRelease('nov-2', '2026-11-18'),
      buildRelease('nov-1', '2026-11-02'),
      buildRelease('oct', '2026-10-30'),
    ]);

    expect(
      groups.map((group) => [
        group.monthKey,
        group.releases.map((release) => release.id),
      ]),
    ).toEqual([
      [null, ['undated']],
      ['2026-11', ['nov-2', 'nov-1']],
      ['2026-10', ['oct']],
    ]);
  });
});

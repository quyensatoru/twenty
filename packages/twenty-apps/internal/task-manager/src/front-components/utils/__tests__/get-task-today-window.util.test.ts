import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTaskTodayWindow } from '../get-task-today-window.util';

afterEach(() => vi.unstubAllEnvs());

describe('Today day boundaries', () => {
  it('uses the browser’s local date on either side of UTC midnight', () => {
    vi.stubEnv('TZ', 'Asia/Bangkok');
    expect(getTaskTodayWindow(new Date('2026-10-11T18:00:00Z'))).toEqual({
      day: '2026-10-12',
      startOfDay: '2026-10-11T17:00:00.000Z',
      nextDay: '2026-10-12T17:00:00.000Z',
      upcomingEnd: '2026-10-19T17:00:00.000Z',
    });
  });

  it('keeps calendar midnights when the upcoming week crosses daylight saving', () => {
    vi.stubEnv('TZ', 'America/New_York');
    expect(getTaskTodayWindow(new Date('2026-03-07T18:00:00Z'))).toEqual({
      day: '2026-03-07',
      startOfDay: '2026-03-07T05:00:00.000Z',
      nextDay: '2026-03-08T05:00:00.000Z',
      upcomingEnd: '2026-03-15T04:00:00.000Z',
    });
  });
});

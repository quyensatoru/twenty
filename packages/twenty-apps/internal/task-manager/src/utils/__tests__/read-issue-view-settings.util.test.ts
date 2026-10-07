import { describe, expect, it } from 'vitest';

import { readIssueViewSettings } from '../read-issue-view-settings.util';

describe('readIssueViewSettings', () => {
  it('reads the hidden fields of both lists', () => {
    expect(
      readIssueViewSettings({
        hiddenDetailFields: ['merchants', 'key'],
        hiddenCardFields: ['reporter'],
      }),
    ).toEqual({
      hiddenDetailFields: ['merchants', 'key'],
      hiddenCardFields: ['reporter'],
    });
  });

  it('drops unknown, repeated and non-string entries', () => {
    expect(
      readIssueViewSettings({
        hiddenDetailFields: ['epic', 'nope', 'epic', 4],
        hiddenCardFields: ['merchants', 'labels'],
      }),
    ).toEqual({ hiddenDetailFields: ['epic'], hiddenCardFields: ['labels'] });
  });

  it('shows everything for nothing stored or a malformed value', () => {
    const everythingShown = { hiddenDetailFields: [], hiddenCardFields: [] };

    expect(readIssueViewSettings(null)).toEqual(everythingShown);
    expect(readIssueViewSettings('hidden')).toEqual(everythingShown);
    expect(readIssueViewSettings({ hiddenDetailFields: 'epic' })).toEqual(
      everythingShown,
    );
  });
});

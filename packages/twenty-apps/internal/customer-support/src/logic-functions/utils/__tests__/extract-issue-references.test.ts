import { describe, expect, it } from 'vitest';

import { extractIssueReferences } from '../extract-issue-references.util';

describe('extractIssueReferences', () => {
  it('finds issue keys written in a note', () => {
    expect(
      extractIssueReferences('Filed as HEAT-4, related to BLOY-120 and HEAT-4'),
    ).toEqual({ issueKeys: ['HEAT-4', 'BLOY-120'], issueIds: [] });
  });

  it('finds the issue id in a pasted record link', () => {
    expect(
      extractIssueReferences(
        'See https://workspace.mida-app.io/object/issue/9033221A-6ACA-4039-811A-3B1DE4C1C5B3',
      ),
    ).toEqual({
      issueKeys: [],
      issueIds: ['9033221a-6aca-4039-811a-3b1de4c1c5b3'],
    });
  });

  it('finds the issue id in a task board link', () => {
    expect(
      extractIssueReferences(
        'https://workspace.mida-app.io/page/3268d987-c8f1-43f6-b9c4-a4c5125a7834#issue-cbe712b3-624a-4f15-91d0-4117f84be300',
      ),
    ).toEqual({
      issueKeys: [],
      issueIds: ['cbe712b3-624a-4f15-91d0-4117f84be300'],
    });
  });

  it('ignores text without a reference', () => {
    expect(
      extractIssueReferences('Customer on plan ss-free, retry at 10-12'),
    ).toEqual({ issueKeys: [], issueIds: [] });
  });
});

import { describe, expect, it } from 'vitest';

import {
  buildIssueCommentUrl,
  buildRecordUrl,
} from '../build-record-url.util';

describe('buildRecordUrl', () => {
  it('prefixes the configured origin', () => {
    expect(
      buildRecordUrl({
        baseUrl: 'https://crm.example.com',
        objectNameSingular: 'issue',
        recordId: 'abc',
      }),
    ).toBe('https://crm.example.com/object/issue/abc');
  });

  it('tolerates a trailing slash on the configured origin', () => {
    expect(
      buildRecordUrl({
        baseUrl: 'https://crm.example.com//',
        objectNameSingular: 'issue',
        recordId: 'abc',
      }),
    ).toBe('https://crm.example.com/object/issue/abc');
  });

  it('falls back to the bare path when nothing is configured', () => {
    expect(
      buildRecordUrl({
        baseUrl: undefined,
        objectNameSingular: 'issue',
        recordId: 'abc',
      }),
    ).toBe('/object/issue/abc');
    expect(
      buildRecordUrl({
        baseUrl: '   ',
        objectNameSingular: 'issue',
        recordId: 'abc',
      }),
    ).toBe('/object/issue/abc');
  });
});

describe('buildIssueCommentUrl', () => {
  it('addresses a comment as a fragment on its issue', () => {
    expect(
      buildIssueCommentUrl({
        baseUrl: 'https://crm.example.com',
        issueId: 'issue-1',
        commentId: 'comment-1',
      }),
    ).toBe('https://crm.example.com/object/issue/issue-1#comment-comment-1');
  });
});

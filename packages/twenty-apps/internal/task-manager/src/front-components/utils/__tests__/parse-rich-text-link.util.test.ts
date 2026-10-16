import { describe, expect, it } from 'vitest';

import {
  findLinkedIssueIds,
  isBareLinkText,
  parseRichTextLink,
} from '../parse-rich-text-link.util';

const ISSUE_ID = '0f8c2a4e-1b2c-4d5e-8f90-123456789abc';
const COMMENT_ID = 'aa8c2a4e-1b2c-4d5e-8f90-123456789abc';
const BASE_URL = 'https://crm.example.com';

describe('parseRichTextLink', () => {
  it('reads an issue link, with the host it names', () => {
    expect(parseRichTextLink(`${BASE_URL}/object/issue/${ISSUE_ID}`)).toEqual({
      kind: 'issue',
      issueId: ISSUE_ID,
      commentId: null,
      domain: 'crm.example.com',
    });
  });

  it('reads the comment a link points at', () => {
    expect(
      parseRichTextLink(
        `${BASE_URL}/object/issue/${ISSUE_ID}#comment-${COMMENT_ID}`,
      ),
    ).toEqual({
      kind: 'issue',
      issueId: ISSUE_ID,
      commentId: COMMENT_ID,
      domain: 'crm.example.com',
    });
  });

  it('reads an issue link under any host name and a bare record path', () => {
    expect(
      parseRichTextLink(`http://localhost:3001/object/issue/${ISSUE_ID}`),
    ).toEqual({
      kind: 'issue',
      issueId: ISSUE_ID,
      commentId: null,
      domain: 'localhost',
    });
    expect(parseRichTextLink(`/object/issue/${ISSUE_ID}`)).toEqual({
      kind: 'issue',
      issueId: ISSUE_ID,
      commentId: null,
      domain: null,
    });
  });

  it('reads the board deep link that opens an issue modal', () => {
    expect(
      parseRichTextLink(
        `http://localhost:3001/page/a81b7737-557a-4218-bcf0-500de387d270#issue-${ISSUE_ID}`,
      ),
    ).toEqual({
      kind: 'issue',
      issueId: ISSUE_ID,
      commentId: null,
      domain: 'localhost',
    });
  });

  it('treats other paths as external links', () => {
    expect(parseRichTextLink('https://www.shopify.dev/docs/api')).toEqual({
      kind: 'external',
      domain: 'shopify.dev',
    });
    expect(parseRichTextLink(`${BASE_URL}/object/company/${ISSUE_ID}`)).toEqual(
      { kind: 'external', domain: 'crm.example.com' },
    );
  });

  it('leaves non-web links alone', () => {
    expect(parseRichTextLink('mailto:someone@example.com')).toBeNull();
    expect(parseRichTextLink('/settings')).toBeNull();
  });
});

describe('isBareLinkText', () => {
  it('matches a link whose text is its address', () => {
    expect(
      isBareLinkText('www.shopify.dev/docs', 'https://www.shopify.dev/docs'),
    ).toBe(true);
    expect(isBareLinkText('https://a.dev/', 'https://a.dev')).toBe(true);
  });

  it('keeps words somebody chose to link', () => {
    expect(isBareLinkText('the docs', 'https://shopify.dev/docs')).toBe(false);
  });
});

describe('findLinkedIssueIds', () => {
  it('collects board deep links too', () => {
    expect(
      findLinkedIssueIds(
        `See https://crm.example.com/page/x#issue-${ISSUE_ID}`,
      ),
    ).toEqual([ISSUE_ID]);
  });

  it('collects every linked issue once', () => {
    expect(
      findLinkedIssueIds(
        `See ${BASE_URL}/object/issue/${ISSUE_ID} and [it](/object/issue/${ISSUE_ID.toUpperCase()}#comment-${COMMENT_ID})`,
      ),
    ).toEqual([ISSUE_ID]);
  });
});

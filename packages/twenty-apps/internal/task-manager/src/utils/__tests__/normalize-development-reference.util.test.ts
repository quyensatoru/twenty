import { describe, expect, it } from 'vitest';

import { normalizeDevelopmentReference } from '../normalize-development-reference.util';

describe('normalizeDevelopmentReference', () => {
  it('reads a branch reference with explicit keys', () => {
    expect(
      normalizeDevelopmentReference({
        kind: 'branch',
        title: 'PROJ-123-cart-totals',
        url: 'https://git.example/acme/webshop/-/tree/PROJ-123-cart-totals',
        externalId: 'PROJ-123-cart-totals',
        authorName: 'Mai',
        issueKeys: ['PROJ-123'],
      }),
    ).toEqual({
      type: 'BRANCH',
      title: 'PROJ-123-cart-totals',
      url: 'https://git.example/acme/webshop/-/tree/PROJ-123-cart-totals',
      status: null,
      externalId: 'PROJ-123-cart-totals',
      authorName: 'Mai',
      issueKeys: ['PROJ-123'],
    });
  });

  it('scans keys out of the title when none are given', () => {
    const reference = normalizeDevelopmentReference({
      kind: 'mr',
      title: 'Fix PROJ-45 checkout totals',
    });

    expect(reference.type).toBe('PULL_REQUEST');
    expect(reference.issueKeys).toEqual(['PROJ-45']);
  });

  it('maps provider shorthands and uppercases statuses', () => {
    expect(normalizeDevelopmentReference({ kind: 'commit' }).type).toBe(
      'COMMIT',
    );
    expect(normalizeDevelopmentReference({ kind: 'merge-request' }).type).toBe(
      'PULL_REQUEST',
    );
    expect(
      normalizeDevelopmentReference({ kind: 'pull_request', status: 'merged' })
        .status,
    ).toBe('MERGED');
    expect(normalizeDevelopmentReference({ kind: 'weird' }).type).toBe(
      'BRANCH',
    );
  });

  it('drops blank texts and merges explicit with scanned keys', () => {
    const reference = normalizeDevelopmentReference({
      title: '  ',
      url: '',
      issueKeys: ['proj-1', '', 42],
      text: 'Also mentions PROJ-2',
    });

    expect(reference.title).toBeNull();
    expect(reference.url).toBeNull();
    expect(reference.issueKeys).toEqual(['PROJ-1', 'PROJ-2']);
  });
});

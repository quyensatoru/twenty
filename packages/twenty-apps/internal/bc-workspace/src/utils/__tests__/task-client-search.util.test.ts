import { describe, expect, it } from 'vitest';

import { rankClientCandidates } from '../task-client-search.util';

const client = (id: string, name: string, shopDomain: string) => ({ id, name, shopDomain });

describe('rankClientCandidates', () => {
  it('puts the exact match, then prefixes, then other substrings first', () => {
    const ranked = rankClientCandidates(
      [
        client('a', 'Aloha Rip Supply', 'aloha-rip.myshopify.com'),
        client('b', 'Ripple Home', 'ripple-home.myshopify.com'),
        client('c', 'Rip', 'rip.myshopify.com'),
        client('d', 'Big Rip Curl', 'bigripcurl.myshopify.com'),
      ],
      'rip',
    );

    expect(ranked.map((candidate) => candidate.id)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('matches a domain typed without the myshopify suffix exactly', () => {
    const ranked = rankClientCandidates(
      [client('a', 'Zed', 'zzz-rip.myshopify.com'), client('b', 'Other', 'rip.myshopify.com')],
      'rip',
    );

    expect(ranked[0].id).toBe('b');
  });

  it('drops duplicates returned by both server queries', () => {
    const duplicate = client('a', 'Rip', 'rip.myshopify.com');

    expect(rankClientCandidates([duplicate, duplicate], 'rip')).toHaveLength(1);
  });
});

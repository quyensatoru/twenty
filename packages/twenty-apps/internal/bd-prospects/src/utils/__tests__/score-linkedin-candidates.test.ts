import { describe, expect, it } from 'vitest';

import { scoreLinkedinCandidates } from '../score-linkedin-candidates';

describe('scoreLinkedinCandidates', () => {
  it('keeps exact company pages and drops lookalikes and non-company urls', () => {
    const scored = scoreLinkedinCandidates({
      domain: 'acmestore.com',
      shopName: 'Acme Store',
      results: [
        {
          title: 'Acme Store | LinkedIn',
          url: 'https://www.linkedin.com/company/acme-store',
          description: 'Official page of Acme Store, acmestore.com',
        },
        {
          title: 'AcmeStore Careers | LinkedIn',
          url: 'https://www.linkedin.com/company/acmestore-careers',
          description: 'Jobs at Acme Store',
        },
        {
          title: 'John Doe | LinkedIn',
          url: 'https://www.linkedin.com/in/johndoe',
          description: 'Works at Acme Store',
        },
        {
          title: 'Acme Store | LinkedIn',
          url: 'https://www.linkedin.com/company/acme-store/jobs/',
          description: 'Jobs',
        },
      ],
    });

    expect(scored.map((page) => page.url)).toEqual([
      'https://www.linkedin.com/company/acme-store',
      'https://www.linkedin.com/company/acmestore-careers',
    ]);
    expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
  });

  it('accepts locale subdomains and stores the canonical url', () => {
    const scored = scoreLinkedinCandidates({
      domain: 'gymshark.com',
      shopName: 'Gymshark',
      results: [
        {
          title: 'Gymshark | LinkedIn',
          url: 'https://uk.linkedin.com/company/gymshark',
          description: 'Official page, gymshark.com',
        },
      ],
    });

    expect(scored).toHaveLength(1);
    expect(scored[0].url).toBe('https://www.linkedin.com/company/gymshark');
  });

  it('dedupes the same slug across result variants', () => {
    const scored = scoreLinkedinCandidates({
      domain: 'acmestore.com',
      results: [
        {
          title: 'AcmeStore',
          url: 'https://linkedin.com/company/acmestore',
          description: '',
        },
        {
          title: 'AcmeStore | LinkedIn',
          url: 'https://www.linkedin.com/company/acmestore/',
          description: '',
        },
      ],
    });

    expect(scored).toHaveLength(1);
  });

  it('returns nothing when no candidate reaches the pass score', () => {
    expect(
      scoreLinkedinCandidates({
        domain: 'acmestore.com',
        results: [
          {
            title: 'Random Store',
            url: 'https://www.linkedin.com/company/random-store',
            description: 'Unrelated shop',
          },
        ],
      }),
    ).toEqual([]);
  });
});

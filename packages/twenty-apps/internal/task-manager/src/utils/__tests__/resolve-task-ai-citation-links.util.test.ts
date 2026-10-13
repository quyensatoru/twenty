import { describe, expect, it } from 'vitest';

import { resolveTaskAiCitationLinks } from '../resolve-task-ai-citation-links.util';

const SHA = 'a'.repeat(40);
const gitlab = {
  slug: 'group/sama/sama-api',
  provider: 'GITLAB',
  remoteUrl: 'https://git.example.com/group/SAMA/sama-api',
};
const github = {
  slug: 'org/front',
  provider: 'GITHUB',
  remoteUrl: 'https://github.com/org/front',
};

describe('resolveTaskAiCitationLinks', () => {
  it('points a GitLab citation at the line on the repository web page', () => {
    expect(
      resolveTaskAiCitationLinks(
        `See [src/a.ts:10](group/sama/sama-api/blob/${SHA}/src/a.ts#L10).`,
        [gitlab, github],
      ),
    ).toBe(
      `See [src/a.ts:10](https://git.example.com/group/SAMA/sama-api/-/blob/${SHA}/src/a.ts#L10).`,
    );
  });

  it('uses the GitHub blob path and the only repository for a generic prefix', () => {
    expect(
      resolveTaskAiCitationLinks(`[a.ts:1](repository/blob/${SHA}/a.ts#L1)`, [
        github,
      ]),
    ).toBe(`[a.ts:1](https://github.com/org/front/blob/${SHA}/a.ts#L1)`);
  });

  it('keeps safe links and turns unresolvable or unsafe links into plain text', () => {
    expect(
      resolveTaskAiCitationLinks(
        '[docs](https://example.com) [page](/object/issue/1) [file](src/a.ts) [x](javascript:void)',
        [gitlab, github],
      ),
    ).toBe('[docs](https://example.com) [page](/object/issue/1) file x');
  });
});

export type ClientSearchCandidate = {
  id: string;
  name: string | null;
  shopDomain: string | null;
};

// Lower is better: an exact name or domain first, then a prefix of either
// (domains are typed from their start), then any substring.
const readRank = (candidate: ClientSearchCandidate, query: string): number => {
  const name = (candidate.name ?? '').toLowerCase();
  const domain = (candidate.shopDomain ?? '').toLowerCase();
  const domainHandle = domain.replace(/\.myshopify\.com$/, '');

  if (name === query || domain === query || domainHandle === query) {
    return 0;
  }

  if (name.startsWith(query) || domain.startsWith(query)) {
    return 1;
  }

  if (name.split(/\s+/).some((word) => word.startsWith(query))) {
    return 2;
  }

  return 3;
};

export const rankClientCandidates = <TCandidate extends ClientSearchCandidate>(
  candidates: TCandidate[],
  rawQuery: string,
): TCandidate[] => {
  const query = rawQuery.trim().toLowerCase();
  const unique = [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()];

  return unique
    .map((candidate) => ({ candidate, rank: readRank(candidate, query) }))
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        (left.candidate.name ?? left.candidate.shopDomain ?? '').localeCompare(
          right.candidate.name ?? right.candidate.shopDomain ?? '',
          undefined,
          { sensitivity: 'base' },
        ) ||
        left.candidate.id.localeCompare(right.candidate.id),
    )
    .map(({ candidate }) => candidate);
};

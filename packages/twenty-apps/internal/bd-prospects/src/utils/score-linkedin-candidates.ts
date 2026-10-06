import { type WebSearchResult } from './serper-search';
import { brandSpaced, domainOfEmail } from './build-linkedin-queries';

export type ScoredLinkedinPage = {
  url: string;
  title: string;
  score: number;
};

// A candidate only counts once the name evidence reaches this. Single shared
// tokens ("store", "shop") score 1 and never pass alone.
export const LINKEDIN_PASS_SCORE = 2;
export const MAX_LINKEDIN_PAGES = 5;

const COMPANY_PATH =
  /^https?:\/\/(?:[\w-]+\.)?linkedin\.com\/company\/([a-z0-9-]+)\/?(\?.*)?$/i;

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const significantTokens = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 3);

export const extractCompanySlug = (url: string): string | undefined => {
  const match = COMPANY_PATH.exec(url.trim());

  return match?.[1]?.toLowerCase();
};

const scoreAgainstName = (
  name: string,
  title: string,
  slug: string,
): number => {
  const normalizedName = normalize(name);

  if (normalizedName.length === 0) {
    return 0;
  }

  const normalizedTitle = normalize(title);
  const normalizedSlug = normalize(slug);

  if (
    normalizedTitle === normalizedName ||
    normalizedSlug === normalizedName
  ) {
    return 3;
  }

  if (
    normalizedTitle.includes(normalizedName) ||
    normalizedName.includes(normalizedTitle)
  ) {
    return 2;
  }

  const tokens = significantTokens(name);
  const haystack = `${normalizedTitle} ${normalizedSlug}`;

  if (
    tokens.length > 0 &&
    tokens.every((token) => haystack.includes(token))
  ) {
    return 2;
  }

  if (tokens.some((token) => haystack.includes(token))) {
    return 1;
  }

  return 0;
};

export const scoreLinkedinCandidates = ({
  results,
  domain,
  shopName,
  email,
}: {
  results: WebSearchResult[];
  domain: string;
  shopName?: string | null;
  email?: string | null;
}): ScoredLinkedinPage[] => {
  const emailDomain =
    typeof email === 'string' ? domainOfEmail(email) : undefined;
  const emailBrand =
    typeof emailDomain === 'string' && emailDomain !== domain.toLowerCase()
      ? brandSpaced(emailDomain)
      : undefined;
  const names = [
    typeof shopName === 'string' && shopName.trim().length > 0
      ? shopName.trim()
      : undefined,
    brandSpaced(domain),
    // Shops on a platform subdomain (xxx.myshopify.com) often trade under
    // the email/web domain, which is also searched, so it must score too.
    typeof emailBrand === 'string' && emailBrand.length > 0
      ? emailBrand
      : undefined,
  ].filter(
    (name): name is string => typeof name === 'string' && name.length > 0,
  );

  const seen = new Set<string>();
  const scored: ScoredLinkedinPage[] = [];

  for (const result of results) {
    const url = result?.url?.trim() ?? '';

    if (url.length === 0) {
      continue;
    }

    const slug = extractCompanySlug(url);

    if (typeof slug !== 'string' || seen.has(slug)) {
      continue;
    }

    seen.add(slug);

    const title = result?.title?.trim() ?? '';
    const description = result?.description ?? '';
    const nameScore = Math.max(
      ...names.map((name) => scoreAgainstName(name, title, slug)),
      0,
    );

    // Official-page signal visible without opening LinkedIn, which blocks
    // scraping: the snippet pointing back at the shop's own domain.
    const descriptionLower = description.toLowerCase();
    const domainSignal =
      (domain.length > 0 &&
        descriptionLower.includes(domain.toLowerCase())) ||
      (typeof emailDomain === 'string' &&
        descriptionLower.includes(emailDomain.toLowerCase()))
        ? 1
        : 0;

    const score = nameScore + domainSignal;

    if (score >= LINKEDIN_PASS_SCORE) {
      // Canonical form: locale subdomains (uk., fr.) all point at the same
      // page, and BD should see one stable link per company.
      scored.push({
        url: `https://www.linkedin.com/company/${slug}`,
        title: title.length > 0 ? title : slug,
        score,
      });
    }
  }

  return scored
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_LINKEDIN_PAGES);
};

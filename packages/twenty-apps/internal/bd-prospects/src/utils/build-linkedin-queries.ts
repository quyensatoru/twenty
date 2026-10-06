// The prospect domain is already normalised (see normalize-domain): bare,
// lowercase, no scheme. The brand is derived from it rather than stored.
const PLATFORM_SUFFIXES = ['myshopify.com', 'shopify.com'];

const stripWww = (domain: string): string =>
  domain.startsWith('www.') ? domain.slice('www.'.length) : domain;

const rootBrand = (domain: string): string => {
  const bare = stripWww(domain.toLowerCase().trim());

  for (const suffix of PLATFORM_SUFFIXES) {
    if (bare === suffix || bare.endsWith(`.${suffix}`)) {
      return bare.slice(0, bare.length - suffix.length - 1).split('.')[0];
    }
  }

  return bare.split('.')[0];
};

export const brandSpaced = (domain: string): string =>
  rootBrand(domain).replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

export const domainOfEmail = (email: string): string | undefined => {
  const at = email.lastIndexOf('@');

  if (at < 0) {
    return undefined;
  }

  const domain = email.slice(at + 1).toLowerCase().trim();

  return domain.length > 0 ? domain : undefined;
};

export const buildLinkedinQueries = ({
  domain,
  shopName,
  email,
}: {
  domain: string;
  shopName?: string | null;
  email?: string | null;
}): string[] => {
  const cleanDomain = stripWww(domain.toLowerCase().trim());
  const displayBrand =
    typeof shopName === 'string' && shopName.trim().length > 0
      ? shopName.trim()
      : brandSpaced(cleanDomain);

  if (displayBrand.length === 0) {
    return [];
  }

  // Note: Serper free accounts reject the quoted-domain pattern
  // (`"domain" linkedin` answers HTTP 400), so domain queries stay unquoted.
  // Quoted brand and site: queries are fine.
  const queries = [
    `"${displayBrand}" linkedin company`,
    `${cleanDomain} linkedin`,
    `site:linkedin.com/company "${displayBrand}"`,
  ];

  const emailDomain =
    typeof email === 'string' ? domainOfEmail(email) : undefined;

  if (
    typeof emailDomain === 'string' &&
    emailDomain !== cleanDomain &&
    brandSpaced(emailDomain).length > 0
  ) {
    queries.push(`${emailDomain} linkedin`);
  }

  return queries;
};

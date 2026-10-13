type CitationRepository = {
  slug: string;
  provider: string;
  remoteUrl: string | null;
};

const MARKDOWN_LINK_PATTERN = /\[((?:\\.|[^\]\\])*)\]\(([^)\s]*)\)/g;

const BLOB_TARGET_PATTERN =
  /^(?:(.+?)\/)?(?:-\/)?blob\/([0-9a-f]{7,64})\/(.+)$/i;

// What the rich text API accepts as a link: http(s), mailto, tel, or a path on
// the same origin.
const isSafeLinkTarget = (target: string) =>
  /^(https?:|mailto:|tel:)/i.test(target) ||
  (target.startsWith('/') && !target.startsWith('//'));

const buildBlobUrl = (
  repository: CitationRepository,
  sha: string,
  pathWithAnchor: string,
) => {
  if (
    repository.remoteUrl === null ||
    !/^https?:\/\//i.test(repository.remoteUrl)
  )
    return null;
  const base = repository.remoteUrl.replace(/\.git$/, '').replace(/\/+$/, '');
  return repository.provider === 'GITHUB'
    ? `${base}/blob/${sha}/${pathWithAnchor}`
    : `${base}/-/blob/${sha}/${pathWithAnchor}`;
};

// The model cites code as `repository/blob/SHA/path#L10`, a relative target the
// comment API rejects as a dangerous protocol. Citations are pointed at the
// repository's web page; anything still not a safe link is kept as plain text.
export const resolveTaskAiCitationLinks = (
  markdown: string,
  repositories: CitationRepository[],
): string =>
  markdown.replace(
    MARKDOWN_LINK_PATTERN,
    (link, text: string, target: string) => {
      if (isSafeLinkTarget(target)) return link;
      const blob = target.match(BLOB_TARGET_PATTERN);
      if (blob !== null) {
        const [, prefix, sha, pathWithAnchor] = blob;
        const repository =
          repositories.find(
            (candidate) =>
              typeof prefix === 'string' &&
              candidate.slug.toLowerCase() === prefix.toLowerCase(),
          ) ?? (repositories.length === 1 ? repositories[0] : undefined);
        const url =
          repository === undefined
            ? null
            : buildBlobUrl(repository, sha, pathWithAnchor);
        if (url !== null) return `[${text}](${url})`;
      }
      return text;
    },
  );

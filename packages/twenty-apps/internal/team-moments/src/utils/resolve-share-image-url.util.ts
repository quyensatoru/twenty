// Bundled assets have a stable path; their build-time host can be internal to the server.
export const resolveShareImageUrl = (
  thumbnailUrl: string | null | undefined,
  fallbackAssetUrl: string,
  publicOrigin: string | null,
): string => {
  if (thumbnailUrl) {
    return thumbnailUrl;
  }

  if (publicOrigin === null) {
    return fallbackAssetUrl;
  }

  const asset = new URL(fallbackAssetUrl);

  return `${publicOrigin}${asset.pathname}${asset.search}`;
};

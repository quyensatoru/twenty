import { RestApiClient } from 'twenty-client-sdk/rest';

const ABSOLUTE_URL_SCHEMES = ['http:', 'https:', 'data:', 'blob:'];

// workspaceMember.avatarUrl is a storage path, not a URL: the host resolves it
// against the server with getImageAbsoluteURI, and the same has to happen here
// because an <img> inside the sandbox is loaded by the browser, not by the
// host.
export const readAvatarImageUrl = (
  avatarUrl: string | null | undefined,
): string | null => {
  if (typeof avatarUrl !== 'string' || avatarUrl === '') {
    return null;
  }

  const lowerCaseAvatarUrl = avatarUrl.toLowerCase();

  if (
    avatarUrl.startsWith('//') ||
    ABSOLUTE_URL_SCHEMES.some((scheme) => lowerCaseAvatarUrl.startsWith(scheme))
  ) {
    return avatarUrl;
  }

  try {
    const baseUrl = new RestApiClient().resolveUrl('/');
    const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;

    return new URL(`/files${path}`, baseUrl).toString();
  } catch {
    return null;
  }
};

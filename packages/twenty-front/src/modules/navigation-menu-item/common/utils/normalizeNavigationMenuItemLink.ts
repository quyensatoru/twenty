import { ensureAbsoluteUrl } from 'twenty-shared/utils';

// In-app paths such as `/task` stay relative so the sidebar routes them with
// react-router; `//host` is protocol-relative (external), so it is not one.
export const normalizeNavigationMenuItemLink = (link: string): string => {
  const trimmedLink = link.trim();

  return /^\/(?!\/)/.test(trimmedLink)
    ? trimmedLink
    : ensureAbsoluteUrl(trimmedLink);
};

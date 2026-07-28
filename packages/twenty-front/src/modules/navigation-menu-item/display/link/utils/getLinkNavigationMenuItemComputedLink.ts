import { type NavigationMenuItem } from '~/generated-metadata/graphql';

export const getLinkNavigationMenuItemComputedLink = (
  item: Pick<NavigationMenuItem, 'link'>,
): string => {
  const linkUrl = (item.link ?? '').trim();
  // Internal app paths (standard-application links like Task Manager) are
  // passed through as-is so NavigationDrawerItem routes them via react-router
  // instead of treating them as an external bookmark.
  if (
    linkUrl.startsWith('http://') ||
    linkUrl.startsWith('https://') ||
    linkUrl.startsWith('/')
  ) {
    return linkUrl;
  }
  return linkUrl ? `https://${linkUrl}` : '';
};

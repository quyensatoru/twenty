import { normalizeNavigationMenuItemLink } from '@/navigation-menu-item/common/utils/normalizeNavigationMenuItemLink';

describe('normalizeNavigationMenuItemLink', () => {
  it('should keep an in-app path relative', () => {
    expect(normalizeNavigationMenuItemLink(' /task ')).toBe('/task');
  });

  it('should keep an absolute url unchanged', () => {
    expect(normalizeNavigationMenuItemLink('https://twenty.com')).toBe(
      'https://twenty.com',
    );
  });

  it('should prefix a bare domain with https', () => {
    expect(normalizeNavigationMenuItemLink('twenty.com')).toBe(
      'https://twenty.com',
    );
  });

  it('should not treat a protocol-relative url as an in-app path', () => {
    expect(normalizeNavigationMenuItemLink('//evil.com')).toBe(
      'https:////evil.com',
    );
  });
});

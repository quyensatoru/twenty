import { buildProjectKeyFromName } from 'src/modules/project/query-hooks/utils/build-project-key-from-name.util';

describe('buildProjectKeyFromName', () => {
  it('builds an acronym from a multi-word name', () => {
    expect(buildProjectKeyFromName('Website Redesign')).toBe('WR');
  });

  it('takes the first letters for a single word name', () => {
    expect(buildProjectKeyFromName('Mobile')).toBe('MOBI');
  });

  it('strips Vietnamese diacritics before building the acronym', () => {
    expect(buildProjectKeyFromName('Dự Án Website')).toBe('DAW');
  });

  it('caps the acronym length for very long names', () => {
    expect(buildProjectKeyFromName('A B C D E F G H I J K')).toBe('ABCDEFGHIJ');
  });

  it('falls back to a default key when the name has no usable characters', () => {
    expect(buildProjectKeyFromName('!!!')).toBe('PROJ');
  });
});

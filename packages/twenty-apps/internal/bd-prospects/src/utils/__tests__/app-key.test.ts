import { describe, expect, it } from 'vitest';

import { mergeAppKeys, toAppKey } from '../app-key';

describe('toAppKey', () => {
  it('should uppercase and collapse separators', () => {
    expect(toAppKey('  bloy loyalty ')).toBe('BLOY_LOYALTY');
    expect(toAppKey('Mida')).toBe('MIDA');
  });

  it('should return null when nothing usable is left', () => {
    expect(toAppKey('   ')).toBeNull();
    expect(toAppKey('***')).toBeNull();
  });
});

describe('mergeAppKeys', () => {
  it('should union, dedupe and sort', () => {
    expect(mergeAppKeys(['MIDA'], ['BLOY', 'MIDA'])).toEqual(['BLOY', 'MIDA']);
  });

  it('should treat a missing current list as empty', () => {
    expect(mergeAppKeys(null, ['MIDA'])).toEqual(['MIDA']);
  });
});

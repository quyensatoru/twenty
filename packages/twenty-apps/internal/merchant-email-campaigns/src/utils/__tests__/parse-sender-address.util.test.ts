import { describe, expect, it } from 'vitest';

import { parseSenderAddress } from '../parse-sender-address.util';

describe('parseSenderAddress', () => {
  it('splits a named address', () => {
    expect(parseSenderAddress('"MIDA Team" <hello@mida.so>')).toEqual({
      name: 'MIDA Team',
      email: 'hello@mida.so',
    });
  });

  it('keeps a bare address', () => {
    expect(parseSenderAddress(' hello@mida.so ')).toEqual({
      name: '',
      email: 'hello@mida.so',
    });
  });
});

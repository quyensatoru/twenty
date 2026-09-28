import { describe, expect, it } from 'vitest';

import { buildEventContactUpdate } from '../build-event-contact-update.util';
import { pickMerchantsForEvent } from '../pick-merchants-for-event.util';

const mida = {
  id: 'm1',
  app: { name: 'MIDA' },
  email: { primaryEmail: 'old@shop.io' },
  contactName: '',
};
const bloy = { id: 'm2', app: { name: 'BLOY' } };

describe('pickMerchantsForEvent', () => {
  it('keeps only the named app, case-insensitively', () => {
    expect(pickMerchantsForEvent([mida, bloy], { appName: 'mida' })).toEqual([
      mida,
    ]);
  });

  it('keeps every row without an app name', () => {
    expect(pickMerchantsForEvent([mida, bloy], { appName: null })).toEqual([
      mida,
      bloy,
    ]);
  });
});

describe('buildEventContactUpdate', () => {
  it('replaces a different email and fills an empty name', () => {
    expect(
      buildEventContactUpdate(mida, {
        email: 'new@shop.io',
        contactName: 'Linh',
      }),
    ).toEqual({
      email: { primaryEmail: 'new@shop.io' },
      contactName: 'Linh',
    });
  });

  it('writes nothing when nothing changed and never overwrites a name', () => {
    expect(
      buildEventContactUpdate(
        { ...mida, contactName: 'Anh' },
        { email: 'old@shop.io', contactName: 'Linh' },
      ),
    ).toBeNull();
  });
});

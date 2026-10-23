import { describe, expect, it, vi } from 'vitest';

vi.mock('twenty-client-sdk/metadata', () => ({ MetadataApiClient: vi.fn() }));

import {
  nextRetryDelayMinutes,
  summarizeErrors,
  toAppRecord,
  toSyncStatus,
} from '../dispatch-discount.util';

describe('toSyncStatus', () => {
  it('keeps an accepted delivery pending until the app reports back', () => {
    expect(toSyncStatus('ACCEPTED')).toBe('PENDING');
    expect(toSyncStatus('TIMEOUT')).toBe('FAILED');
    expect(toSyncStatus('REJECTED')).toBe('REJECTED');
  });
});

describe('nextRetryDelayMinutes', () => {
  it('backs off and then stops', () => {
    expect([1, 2, 3, 4, 5].map(nextRetryDelayMinutes)).toEqual([
      1,
      5,
      30,
      120,
      null,
    ]);
  });
});

describe('toAppRecord', () => {
  it('sends the discount columns without the CRM bookkeeping', () => {
    expect(
      toAppRecord({
        id: 'discount-1',
        discountCode: 'MIDA25',
        syncStatus: 'REJECTED',
        syncError: 'x',
        app: { id: 'app-1', name: 'MIDA' },
        appId: 'app-1',
      }),
    ).toEqual({ id: 'discount-1', discountCode: 'MIDA25', appId: 'app-1' });
  });
});

describe('summarizeErrors', () => {
  it('prefixes the field when the app named one', () => {
    expect(
      summarizeErrors([
        { field: 'discountCode', code: 'duplicate', message: 'code taken' },
        { field: null, code: null, message: 'try later' },
      ]),
    ).toBe('discountCode: code taken; try later');
    expect(summarizeErrors([])).toBeNull();
  });
});

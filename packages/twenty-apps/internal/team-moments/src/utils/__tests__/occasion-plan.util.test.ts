import { describe, expect, it } from 'vitest';

import {
  buildVietQrImageUrl,
  countRsvps,
  formatVndShort,
  parseVndInput,
  sumContributions,
  upsertContribution,
} from '../occasion-plan.util';

describe('buildVietQrImageUrl', () => {
  it('builds a compact QR with amount, note and holder', () => {
    expect(
      buildVietQrImageUrl({ bankCode: 'vcb', accountNumber: '0123 456 789', accountName: 'Pham Ngoc Anh', amount: 100000, note: 'Qua sinh nhat Thu Ha' }),
    ).toBe('https://img.vietqr.io/image/VCB-0123456789-compact2.png?amount=100000&addInfo=Qua+sinh+nhat+Thu+Ha&accountName=Pham+Ngoc+Anh');
  });
});

describe('contributions', () => {
  it('replaces a member previous contribution instead of adding a second one', () => {
    const first = upsertContribution(null, { memberId: 'm1', name: 'Huy', amount: 50000, contributedAt: 'a' });
    const updated = upsertContribution(first, { memberId: 'm1', name: 'Huy', amount: 100000, contributedAt: 'b' });

    expect(updated).toHaveLength(1);
    expect(sumContributions([...updated, { memberId: 'm2', name: 'Đức', amount: 200000, contributedAt: 'c' }])).toBe(300000);
  });
});

describe('countRsvps', () => {
  it('counts each status', () => {
    expect(countRsvps({ m1: 'GOING', m2: 'GOING', m3: 'NO' })).toEqual({ GOING: 2, MAYBE: 0, NO: 1 });
  });
});

describe('VND helpers', () => {
  it('reads the shorthands people type', () => {
    expect(parseVndInput('100k')).toBe(100000);
    expect(parseVndInput('1,5tr')).toBe(1500000);
    expect(parseVndInput('200.000')).toBe(200000);
    expect(parseVndInput('abc')).toBeNull();
  });

  it('shortens amounts', () => {
    expect(formatVndShort(640000)).toBe('640k');
    expect(formatVndShort(1200000)).toBe('1,2tr');
  });
});

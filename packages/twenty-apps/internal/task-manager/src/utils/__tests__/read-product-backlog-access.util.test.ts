import { describe, expect, it } from 'vitest';

import { readProductBacklogAccess } from '../read-product-backlog-access.util';

const PMA = { id: 'role-pma', label: 'PMA' };
const CSE = { id: 'role-cse', label: 'CSE' };
const DEV = { id: 'role-dev', label: 'Dev' };

const read = (
  roles: { id: string; label: string }[],
  canBypassAppScope = false,
) =>
  readProductBacklogAccess({
    roles,
    canBypassAppScope,
    editorRoles: 'role-pma, Product',
    hiddenRoles: 'cse',
  });

describe('readProductBacklogAccess', () => {
  it('lets admins and editor roles change the backlog', () => {
    expect(read([DEV], true)).toBe('EDIT');
    expect(read([PMA])).toBe('EDIT');
    expect(read([{ id: 'role-product', label: 'product' }])).toBe('EDIT');
  });

  it('matches by id, so a renamed role keeps its access', () => {
    expect(read([{ id: 'role-pma', label: 'Product Manager' }])).toBe('EDIT');
  });

  it('keeps hidden roles out, even when they also hold an editor role', () => {
    expect(read([CSE])).toBe('NONE');
    expect(read([CSE, PMA])).toBe('NONE');
  });

  it('lets every other role read it', () => {
    expect(read([DEV])).toBe('VIEW');
    expect(read([])).toBe('VIEW');
  });
});

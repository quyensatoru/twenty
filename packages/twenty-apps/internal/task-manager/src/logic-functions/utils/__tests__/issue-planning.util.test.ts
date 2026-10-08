import { describe, expect, it } from 'vitest';

import { pickPlanningChanges } from '../issue-planning.util';

describe('pickPlanningChanges', () => {
  it('ignores a write that touches neither sprint nor epic', () => {
    expect(pickPlanningChanges({ title: 'x' })).toEqual({});
  });

  it('keeps the sprint and epic a write sets', () => {
    expect(pickPlanningChanges({ sprintId: 's1', epicId: 'e1' })).toEqual({
      sprintId: 's1',
      epicId: 'e1',
    });
  });

  it('reads a cleared or blank value as clearing the field', () => {
    expect(pickPlanningChanges({ sprintId: null, epicId: '' })).toEqual({
      sprintId: null,
      epicId: null,
    });
  });

  it('leaves out the field that is not part of the write', () => {
    expect(pickPlanningChanges({ epicId: 'e1' })).toEqual({ epicId: 'e1' });
  });
});

import { describe, expect, it } from 'vitest';

import { buildDefaultSprintName } from '../build-default-sprint-name.util';

describe('buildDefaultSprintName', () => {
  it('starts at 1 for a project with no sprints', () => {
    expect(buildDefaultSprintName({ projectKey: 'MOB', existingNames: [] })).toBe(
      'MOB Sprint 1',
    );
  });

  it('continues after the highest numbered sprint', () => {
    expect(
      buildDefaultSprintName({
        projectKey: 'MOB',
        existingNames: ['MOB Sprint 1', 'MOB Sprint 3', 'Release train', null],
      }),
    ).toBe('MOB Sprint 4');
  });

  it('ignores sprints named another way', () => {
    expect(
      buildDefaultSprintName({ projectKey: 'MOB', existingNames: ['Sprint 9'] }),
    ).toBe('MOB Sprint 1');
  });

  it('drops the key when the project has none', () => {
    expect(
      buildDefaultSprintName({ projectKey: null, existingNames: ['Sprint 2'] }),
    ).toBe('Sprint 3');
  });
});

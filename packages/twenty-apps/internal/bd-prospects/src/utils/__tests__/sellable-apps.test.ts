import { describe, expect, it } from 'vitest';

import {
  OUR_APPS_OPTIONS,
  SELLABLE_APPS,
} from '../../constants/registered-apps';

describe('sellable apps', () => {
  it('should offer every sellable app as an "Our apps" value', () => {
    expect(OUR_APPS_OPTIONS.map((option) => option.value)).toEqual(
      SELLABLE_APPS.map((app) => app.key),
    );
  });

  it('should declare only the apps this team sells', () => {
    expect(SELLABLE_APPS.map((app) => app.key)).toEqual(['BLOY', 'MIDA']);
  });

  it('should give every sellable app its own stage column', () => {
    expect(SELLABLE_APPS.map((app) => app.stage.name)).toEqual([
      'bloyStage',
      'midaStage',
    ]);
  });

  it('should keep every option id and stage field id distinct', () => {
    const identifiers = [
      ...SELLABLE_APPS.map((app) => app.optionId),
      ...SELLABLE_APPS.flatMap((app) => [
        app.stage.fieldUniversalIdentifier,
        ...app.stage.optionIds,
      ]),
    ];

    expect(new Set(identifiers).size).toBe(identifiers.length);
  });

  it('should keep no app key a prefix of another, which the %value% filter would confuse', () => {
    const keys = SELLABLE_APPS.map((app) => app.key);
    const collisions = keys.filter((key) =>
      keys.some((other) => other !== key && other.startsWith(key)),
    );

    expect(collisions).toEqual([]);
  });
});

import { FieldMetadataType } from 'twenty-shared/types';

import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { resolveRelationFromFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/resolve-relation-from-flat-field-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { buildAppScopePathByObjectId } from 'src/engine/twenty-orm/utils/build-app-scope-path-by-object-id.util';

jest.mock(
  'src/engine/metadata-modules/flat-field-metadata/utils/resolve-relation-from-flat-field-metadata.util',
);

const resolveRelationMock = jest.mocked(resolveRelationFromFlatFieldMetadata);

// Every relation in this fixture is MANY_TO_ONE, keyed by the "many" side
// that owns the field: `app` (the scope root's target), `project` (the
// intended app-scope root), `appAccess` (a permission grant FOR an app —
// must NOT become an app-scope root itself), and `workspaceMember` (a plain
// unrelated relation target, to make sure BFS doesn't wrongly reach it).
const RELATIONS: Record<string, { fieldName: string; targetObjectId: string }> =
  {
    'project.app': { fieldName: 'app', targetObjectId: 'app' },
    'appAccess.app': { fieldName: 'app', targetObjectId: 'app' },
    'appAccess.member': {
      fieldName: 'member',
      targetObjectId: 'workspaceMember',
    },
  };

const buildFixtures = () => {
  const objectIds = ['app', 'project', 'appAccess', 'workspaceMember'];

  const fieldsByObjectId: Record<string, string[]> = {
    app: [],
    project: ['project.app'],
    appAccess: ['appAccess.app', 'appAccess.member'],
    workspaceMember: [],
  };

  const flatObjectMetadataMaps = {
    byUniversalIdentifier: Object.fromEntries(
      objectIds.map((id) => [
        id,
        {
          id,
          nameSingular: id,
          fieldIds: fieldsByObjectId[id],
        } as unknown as FlatObjectMetadata,
      ]),
    ),
    universalIdentifierById: Object.fromEntries(
      objectIds.map((id) => [id, id]),
    ),
  } as unknown as FlatEntityMaps<FlatObjectMetadata>;

  const allFieldIds = Object.values(fieldsByObjectId).flat();

  const flatFieldMetadataMaps = {
    byUniversalIdentifier: Object.fromEntries(
      allFieldIds.map((id) => [
        id,
        {
          id,
          type: FieldMetadataType.RELATION,
        } as unknown as FlatFieldMetadata,
      ]),
    ),
    universalIdentifierById: Object.fromEntries(
      allFieldIds.map((id) => [id, id]),
    ),
  } as unknown as FlatEntityMaps<FlatFieldMetadata>;

  resolveRelationMock.mockImplementation(({ sourceFlatFieldMetadata }) => {
    const relation = RELATIONS[sourceFlatFieldMetadata.id];

    if (!relation) {
      return null;
    }

    const sourceObjectId = sourceFlatFieldMetadata.id.split('.')[0];

    return {
      type: RelationType.MANY_TO_ONE,
      sourceObjectMetadata: { id: sourceObjectId },
      targetObjectMetadata: { id: relation.targetObjectId },
      sourceFieldMetadata: { name: relation.fieldName },
      targetFieldMetadata: { name: relation.fieldName },
    } as ReturnType<typeof resolveRelationFromFlatFieldMetadata>;
  });

  return { flatObjectMetadataMaps, flatFieldMetadataMaps };
};

afterEach(() => {
  resolveRelationMock.mockReset();
});

describe('buildAppScopePathByObjectId', () => {
  it('marks `app` itself as IS_APP_ITSELF', () => {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } = buildFixtures();

    const result = buildAppScopePathByObjectId({
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    });

    expect(result['app']).toBe('IS_APP_ITSELF');
  });

  it('marks `project` as the app-scope root (empty path)', () => {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } = buildFixtures();

    const result = buildAppScopePathByObjectId({
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    });

    expect(result['project']).toEqual([]);
  });

  it('does not treat `appAccess` as an app-scope root despite its own FK to `app`', () => {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } = buildFixtures();

    const result = buildAppScopePathByObjectId({
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    });

    // Regression guard: appAccess must fall through to null (unscoped) rather
    // than `[]` — otherwise deleting an appAccess grant would require the
    // acting member to already hold that same grant, blocking all deletes.
    expect(result['appAccess']).toBeNull();
  });

  it('leaves an unrelated object (no path to app) unscoped', () => {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } = buildFixtures();

    const result = buildAppScopePathByObjectId({
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    });

    expect(result['workspaceMember']).toBeNull();
  });
});

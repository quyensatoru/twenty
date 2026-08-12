import { FieldMetadataType } from 'twenty-shared/types';

import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { resolveRelationFromFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/resolve-relation-from-flat-field-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { PermissionsException } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { validateAppScopeForRecords } from 'src/engine/twenty-orm/utils/validate-app-scope-for-records.util';

jest.mock(
  'src/engine/metadata-modules/flat-field-metadata/utils/resolve-relation-from-flat-field-metadata.util',
);

const resolveRelationMock = jest.mocked(resolveRelationFromFlatFieldMetadata);

const MEMBER_ID = 'member-1';
const GRANTED_APP_ID = 'app-granted';
const OTHER_APP_ID = 'app-not-granted';

const RELATIONS: Record<string, { fieldName: string; targetObjectId: string }> =
  {
    'project.app': { fieldName: 'app', targetObjectId: 'app' },
    'discount.app': { fieldName: 'app', targetObjectId: 'app' },
  };

const buildInternalContext = (): WorkspaceInternalContext => {
  const objectIds = ['app', 'project', 'discount'];

  const fieldsByObjectId: Record<string, string[]> = {
    app: [],
    project: ['project.app'],
    discount: ['discount.app'],
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
          name: 'app',
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

    return {
      type: RelationType.MANY_TO_ONE,
      sourceObjectMetadata: { id: sourceFlatFieldMetadata.id.split('.')[0] },
      targetObjectMetadata: { id: relation.targetObjectId },
      sourceFieldMetadata: { name: relation.fieldName },
      targetFieldMetadata: { name: relation.fieldName },
    } as ReturnType<typeof resolveRelationFromFlatFieldMetadata>;
  });

  return {
    workspaceId: 'workspace-1',
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
    appScopeGrantsByMemberId: {
      [MEMBER_ID]: { [GRANTED_APP_ID]: ['read', 'write'] },
    },
    allObjectRecordsRoleFlagsByRoleId: {},
    userWorkspaceRoleMap: {},
    apiKeyRoleMap: {},
  } as unknown as WorkspaceInternalContext;
};

const AUTH_CONTEXT = {
  type: 'user',
  workspaceMemberId: MEMBER_ID,
} as unknown as WorkspaceAuthContext;

const validate = ({
  nameSingular,
  values,
  mode,
  internalContext,
}: {
  nameSingular: string;
  values: Record<string, unknown>[];
  mode: 'insert' | 'update';
  internalContext: WorkspaceInternalContext;
}) =>
  validateAppScopeForRecords({
    values,
    objectMetadata: internalContext.flatObjectMetadataMaps
      .byUniversalIdentifier[nameSingular] as FlatObjectMetadata,
    internalContext,
    authContext: AUTH_CONTEXT,
    shouldBypassPermissionChecks: false,
    mode,
  });

afterEach(() => {
  resolveRelationMock.mockReset();
});

describe('validateAppScopeForRecords', () => {
  it('accepts an insert into an app the member can write', () => {
    const internalContext = buildInternalContext();

    expect(() =>
      validate({
        nameSingular: 'discount',
        values: [{ appId: GRANTED_APP_ID }],
        mode: 'insert',
        internalContext,
      }),
    ).not.toThrow();
  });

  it('rejects an insert into an app the member has no grant for', () => {
    const internalContext = buildInternalContext();

    expect(() =>
      validate({
        nameSingular: 'discount',
        values: [{ appId: OTHER_APP_ID }],
        mode: 'insert',
        internalContext,
      }),
    ).toThrow(PermissionsException);
  });

  it('reads the app out of a nested relation value too', () => {
    const internalContext = buildInternalContext();

    expect(() =>
      validate({
        nameSingular: 'discount',
        values: [{ app: { id: OTHER_APP_ID } }],
        mode: 'insert',
        internalContext,
      }),
    ).toThrow(PermissionsException);
  });

  it('accepts an app-less insert on an unassigned-visible object', () => {
    const internalContext = buildInternalContext();

    expect(() =>
      validate({
        nameSingular: 'discount',
        values: [{ name: 'BLOY20' }],
        mode: 'insert',
        internalContext,
      }),
    ).not.toThrow();
  });

  it('rejects an app-less insert on a fail-closed object', () => {
    const internalContext = buildInternalContext();

    // Otherwise the row lands in the table and is immediately invisible to
    // its own author.
    expect(() =>
      validate({
        nameSingular: 'project',
        values: [{ name: 'Orphan project' }],
        mode: 'insert',
        internalContext,
      }),
    ).toThrow(PermissionsException);
  });

  it('ignores updates that do not touch the app', () => {
    const internalContext = buildInternalContext();

    expect(() =>
      validate({
        nameSingular: 'project',
        values: [{ name: 'Renamed' }],
        mode: 'update',
        internalContext,
      }),
    ).not.toThrow();
  });

  it('rejects reassigning a row to an app the member has no grant for', () => {
    const internalContext = buildInternalContext();

    expect(() =>
      validate({
        nameSingular: 'discount',
        values: [{ appId: OTHER_APP_ID }],
        mode: 'update',
        internalContext,
      }),
    ).toThrow(PermissionsException);
  });

  it('rejects clearing the app on a fail-closed object', () => {
    const internalContext = buildInternalContext();

    expect(() =>
      validate({
        nameSingular: 'project',
        values: [{ appId: null }],
        mode: 'update',
        internalContext,
      }),
    ).toThrow(PermissionsException);
  });

  it('leaves objects that are not app-scoped alone', () => {
    const internalContext = buildInternalContext();

    expect(() =>
      validate({
        nameSingular: 'app',
        values: [{ name: 'New app' }],
        mode: 'insert',
        internalContext,
      }),
    ).not.toThrow();
  });
});

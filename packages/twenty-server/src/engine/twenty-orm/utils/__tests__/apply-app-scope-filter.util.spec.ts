import { FieldMetadataType } from 'twenty-shared/types';

import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { applyAppScopeFilter } from 'src/engine/twenty-orm/utils/apply-app-scope-filter.util';

const MEMBER_ID = 'member-1';
const GRANTED_APP_ID = 'app-granted';

// `project` (task-manager, fail-closed on a missing app) and `discount` (the
// CRM catalog object, where a row with no app is "not assigned yet") both hold
// a direct MANY_TO_ONE to `app`.
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
          settings: { relationType: RelationType.MANY_TO_ONE },
          relationTargetObjectMetadataId: RELATIONS[id]?.targetObjectId ?? null,
        } as unknown as FlatFieldMetadata,
      ]),
    ),
    universalIdentifierById: Object.fromEntries(
      allFieldIds.map((id) => [id, id]),
    ),
  } as unknown as FlatEntityMaps<FlatFieldMetadata>;


  return {
    // getWorkspaceSchemaName base36-encodes this as a UUID hex string, so it
    // must look like one even though nothing here reads it as an actual id.
    workspaceId: '20202020-0000-4000-8000-000000000001',
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

const buildQueryBuilder = (alias = 'discount') => ({
  andWhere: jest.fn(),
  alias,
});

const AUTH_CONTEXT = {
  type: 'user',
  workspaceMemberId: MEMBER_ID,
} as unknown as WorkspaceAuthContext;

const applyFilterOn = ({
  nameSingular,
  internalContext,
  alias,
}: {
  nameSingular: string;
  internalContext: WorkspaceInternalContext;
  alias?: string;
}) => {
  const queryBuilder = buildQueryBuilder(alias ?? nameSingular);

  applyAppScopeFilter({
    queryBuilder,
    objectMetadata: internalContext.flatObjectMetadataMaps
      .byUniversalIdentifier[nameSingular] as FlatObjectMetadata,
    internalContext,
    authContext: AUTH_CONTEXT,
    shouldBypassPermissionChecks: false,
    operation: 'read',
  });

  return queryBuilder;
};

describe('applyAppScopeFilter', () => {
  it('keeps app-less rows of an unassigned-visible object reachable', () => {
    const internalContext = buildInternalContext();

    const queryBuilder = applyFilterOn({
      nameSingular: 'discount',
      internalContext,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'COALESCE("discount"."appId" IN (:...appScopeGrantedAppIds), TRUE)',
      { appScopeGrantedAppIds: [GRANTED_APP_ID] },
    );
  });

  it('still hides app-less rows of an object that is not unassigned-visible', () => {
    const internalContext = buildInternalContext();

    const queryBuilder = applyFilterOn({
      nameSingular: 'project',
      internalContext,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '"project"."appId" IN (:...appScopeGrantedAppIds)',
      { appScopeGrantedAppIds: [GRANTED_APP_ID] },
    );
  });

  it('falls back to app-less rows only when the member holds no grant at all', () => {
    const internalContext = buildInternalContext();

    internalContext.appScopeGrantsByMemberId[MEMBER_ID] = {};

    const queryBuilder = applyFilterOn({
      nameSingular: 'discount',
      internalContext,
    });

    // An empty granted list can't be spread into `IN (:...)`.
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '"discount"."appId" IS NULL',
      { appScopeGrantedAppIds: [] },
    );
  });

  it('keeps using the query alias regardless of the alias the caller passes in', () => {
    const internalContext = buildInternalContext();

    const queryBuilder = applyFilterOn({
      nameSingular: 'discount',
      internalContext,
      alias: 'my_discount_alias',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'COALESCE("my_discount_alias"."appId" IN (:...appScopeGrantedAppIds), TRUE)',
      { appScopeGrantedAppIds: [GRANTED_APP_ID] },
    );
  });

  it('hides everything when a member without grants queries a fail-closed object', () => {
    const internalContext = buildInternalContext();

    internalContext.appScopeGrantsByMemberId[MEMBER_ID] = {};

    const queryBuilder = applyFilterOn({
      nameSingular: 'project',
      internalContext,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('1 = 0');
  });
});

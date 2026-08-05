import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { getFlatFieldsFromFlatObjectMetadata } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-flat-fields-for-flat-object-metadata.util';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { computeMorphOrRelationFieldJoinColumnName } from 'src/engine/metadata-modules/field-metadata/utils/compute-morph-or-relation-field-join-column-name.util';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { isFlatFieldMetadataOfType } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-flat-field-metadata-of-type.util';
import { resolveRelationFromFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/resolve-relation-from-flat-field-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';

const APP_OBJECT_NAME_SINGULAR = 'app';
const DEFAULT_MAX_APP_SCOPE_DEPTH = 4;

// `appAccess` holds a MANY_TO_ONE to `app` too, but only to record which app
// a permission grant is FOR — it isn't app-scoped content. Left in
// `appHolderObjectIds`, deleting an appAccess row would require the acting
// member to already hold a grant on that same app, which is circular and
// blocks legitimate deletes. Exclude it so appAccess falls through to
// `null` (unscoped) and is governed only by normal object permissions.
const APP_SCOPE_ROOT_EXCLUDED_NAMES_SINGULAR = new Set(['appAccess']);

// objectMetadataId -> ordered relation field names to traverse (MANY_TO_ONE,
// "many" side only) from that object down to the app-scope root (the object
// that directly holds the FK to `app` — `project`, today).
// [] means the object itself is the app-scope root (it has a direct FK column
// to `app`). 'IS_APP_ITSELF' means the object IS `app` — scoped by comparing
// its own `id`, not a join column, since `app` has no FK to itself. null means
// the object isn't reachable from `app` within maxDepth (not scoped at all).
export type AppScopePathByObjectId = Record<
  string,
  string[] | null | 'IS_APP_ITSELF'
>;

type ManyToOneEdge = { fieldName: string; targetObjectId: string };

// A single forward MANY_TO_ONE hop, resolved to its full target FlatObjectMetadata
// (not the DTO shape `resolveRelationFromFlatFieldMetadata` returns, which is
// missing fields like `applicationUniversalIdentifier` needed to compute table names).
export type AppScopeHop = {
  joinColumnName: string;
  targetObjectMetadata: FlatObjectMetadata;
};

export const buildAppScopePathByObjectId = ({
  flatObjectMetadataMaps,
  flatFieldMetadataMaps,
  maxDepth = DEFAULT_MAX_APP_SCOPE_DEPTH,
}: {
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  maxDepth?: number;
}): AppScopePathByObjectId => {
  const { idByNameSingular } = buildObjectIdByNameMaps(flatObjectMetadataMaps);
  const appObjectId = idByNameSingular[APP_OBJECT_NAME_SINGULAR];

  if (!isDefined(appObjectId)) {
    return {};
  }

  const manyToOneEdgesByObjectId = buildManyToOneEdgesByObjectId({
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
  });

  const excludedObjectIds = new Set(
    Object.entries(idByNameSingular)
      .filter(([nameSingular]) =>
        APP_SCOPE_ROOT_EXCLUDED_NAMES_SINGULAR.has(nameSingular),
      )
      .map(([, id]) => id),
  );

  const appHolderObjectIds = new Set<string>();

  for (const [objectId, edges] of Object.entries(manyToOneEdgesByObjectId)) {
    if (excludedObjectIds.has(objectId)) {
      continue;
    }

    if (edges.some((edge) => edge.targetObjectId === appObjectId)) {
      appHolderObjectIds.add(objectId);
    }
  }

  const result: AppScopePathByObjectId = {};

  for (const objectId of Object.keys(manyToOneEdgesByObjectId)) {
    result[objectId] = findShortestPathToAppHolder({
      startObjectId: objectId,
      appHolderObjectIds,
      manyToOneEdgesByObjectId,
      maxDepth,
    });
  }

  // `app` is never a BFS target (it has no MANY_TO_ONE edge to itself), so it
  // would otherwise fall through to `null` (unscoped) once the search space is
  // exhausted. Mark it explicitly instead of relying on that fallthrough.
  result[appObjectId] = 'IS_APP_ITSELF';

  return result;
};

// Given an object and a scope path (field names, as returned above), resolves
// each hop's join column name and full target FlatObjectMetadata. Used by both
// the read-path filter (Section E) and the write-guard (Section F) to build
// SQL / walk the DB generically, without re-deriving field metadata twice.
export const resolveAppScopeHops = ({
  objectMetadata,
  scopePath,
  flatObjectMetadataMaps,
  flatFieldMetadataMaps,
}: {
  objectMetadata: FlatObjectMetadata;
  scopePath: string[];
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
}): AppScopeHop[] => {
  const hops: AppScopeHop[] = [];
  let currentObjectMetadata = objectMetadata;

  for (const fieldName of scopePath) {
    const field = getFlatFieldsFromFlatObjectMetadata(
      currentObjectMetadata,
      flatFieldMetadataMaps,
    ).find((candidate) => candidate.name === fieldName);

    if (
      !isDefined(field) ||
      !isFlatFieldMetadataOfType(field, FieldMetadataType.RELATION)
    ) {
      return [];
    }

    const relation = resolveRelationFromFlatFieldMetadata({
      sourceFlatFieldMetadata: field,
      flatFieldMetadataMaps,
      flatObjectMetadataMaps,
    });

    const targetObjectMetadata = isDefined(relation)
      ? findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: relation.targetObjectMetadata.id,
          flatEntityMaps: flatObjectMetadataMaps,
        })
      : undefined;

    if (!isDefined(relation) || !isDefined(targetObjectMetadata)) {
      return [];
    }

    hops.push({
      joinColumnName: computeMorphOrRelationFieldJoinColumnName({
        name: field.name,
      }),
      targetObjectMetadata,
    });

    currentObjectMetadata = targetObjectMetadata;
  }

  return hops;
};

// Finds the join column name of the field on `objectMetadata` that directly
// relates (MANY_TO_ONE) to `app`, if any — i.e. the app-scope root's own FK
// column into `app` (`project.appId`, today).
export const findAppJoinColumnName = ({
  objectMetadata,
  flatObjectMetadataMaps,
  flatFieldMetadataMaps,
}: {
  objectMetadata: FlatObjectMetadata;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
}): string | null => {
  const { idByNameSingular } = buildObjectIdByNameMaps(flatObjectMetadataMaps);
  const appObjectId = idByNameSingular[APP_OBJECT_NAME_SINGULAR];

  if (!isDefined(appObjectId)) {
    return null;
  }

  for (const field of getFlatFieldsFromFlatObjectMetadata(
    objectMetadata,
    flatFieldMetadataMaps,
  )) {
    if (!isFlatFieldMetadataOfType(field, FieldMetadataType.RELATION)) {
      continue;
    }

    const relation = resolveRelationFromFlatFieldMetadata({
      sourceFlatFieldMetadata: field,
      flatFieldMetadataMaps,
      flatObjectMetadataMaps,
    });

    if (
      !isDefined(relation) ||
      relation.type !== RelationType.MANY_TO_ONE ||
      relation.targetObjectMetadata.id !== appObjectId
    ) {
      continue;
    }

    return computeMorphOrRelationFieldJoinColumnName({ name: field.name });
  }

  return null;
};

const buildManyToOneEdgesByObjectId = ({
  flatObjectMetadataMaps,
  flatFieldMetadataMaps,
}: {
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
}): Record<string, ManyToOneEdge[]> => {
  const edgesByObjectId: Record<string, ManyToOneEdge[]> = {};

  for (const objectMetadata of Object.values(
    flatObjectMetadataMaps.byUniversalIdentifier,
  )) {
    if (!isDefined(objectMetadata)) {
      continue;
    }

    const edges: ManyToOneEdge[] = [];

    for (const field of getFlatFieldsFromFlatObjectMetadata(
      objectMetadata,
      flatFieldMetadataMaps,
    )) {
      if (!isFlatFieldMetadataOfType(field, FieldMetadataType.RELATION)) {
        continue;
      }

      const relation = resolveRelationFromFlatFieldMetadata({
        sourceFlatFieldMetadata: field,
        flatFieldMetadataMaps,
        flatObjectMetadataMaps,
      });

      if (!isDefined(relation) || relation.type !== RelationType.MANY_TO_ONE) {
        continue;
      }

      // Only forward hops owned by the current object (the "many" side, i.e.
      // the one holding the foreign key) — never the reverse ONE_TO_MANY
      // inverse field. We only ever want to walk "up" toward parents.
      if (relation.sourceObjectMetadata.id !== objectMetadata.id) {
        continue;
      }

      edges.push({
        fieldName: field.name,
        targetObjectId: relation.targetObjectMetadata.id,
      });
    }

    edgesByObjectId[objectMetadata.id] = edges;
  }

  return edgesByObjectId;
};

const findShortestPathToAppHolder = ({
  startObjectId,
  appHolderObjectIds,
  manyToOneEdgesByObjectId,
  maxDepth,
}: {
  startObjectId: string;
  appHolderObjectIds: Set<string>;
  manyToOneEdgesByObjectId: Record<string, ManyToOneEdge[]>;
  maxDepth: number;
}): string[] | null => {
  if (appHolderObjectIds.has(startObjectId)) {
    return [];
  }

  let frontier: { objectId: string; path: string[] }[] = [
    { objectId: startObjectId, path: [] },
  ];
  const visitedObjectIds = new Set<string>([startObjectId]);

  for (let depth = 0; depth < maxDepth; depth++) {
    const nextFrontier: typeof frontier = [];

    for (const { objectId, path } of frontier) {
      const edges = manyToOneEdgesByObjectId[objectId] ?? [];

      for (const edge of edges) {
        const nextPath = [...path, edge.fieldName];

        if (appHolderObjectIds.has(edge.targetObjectId)) {
          return nextPath;
        }

        if (!visitedObjectIds.has(edge.targetObjectId)) {
          visitedObjectIds.add(edge.targetObjectId);
          nextFrontier.push({ objectId: edge.targetObjectId, path: nextPath });
        }
      }
    }

    frontier = nextFrontier;
  }

  return null;
};

import {
  Brackets,
  NotBrackets,
  type ObjectLiteral,
  type WhereExpressionBuilder,
} from 'typeorm';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

import { GraphqlQueryFilterFieldParser } from 'src/engine/api/graphql/graphql-query-runner/graphql-query-parsers/graphql-query-filter/graphql-query-filter-field.parser';
import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { substituteCurrentMemberPlaceholder } from 'src/engine/metadata-modules/record-visibility-policy/utils/substitute-current-member-placeholder.util';
import { type WorkspaceSelectQueryBuilder } from 'src/engine/twenty-orm/repository/workspace-select-query-builder';
import { resolveRoleIdFromAuthContext } from 'src/engine/twenty-orm/utils/resolve-role-id-from-auth-context.util';

// OSS equivalent of Enterprise's apply-row-level-permission-predicates.util.ts
// — mirrors the technique (Brackets/NotBrackets walk delegating field-level
// parsing to GraphqlQueryFilterFieldParser, itself not Enterprise) without
// importing that file. Simpler than the original in one respect: since a
// Record Visibility Policy only ever filters on fields of the object it's
// attached to (never a relation's own attributes), there's no equivalent of
// RLS's workspaceMemberFieldMetadataId lookup — just a placeholder swap.
type ApplyRecordVisibilityFilterArgs<T extends ObjectLiteral> = {
  queryBuilder: WorkspaceSelectQueryBuilder<T>;
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
};

export const applyRecordVisibilityFilter = <T extends ObjectLiteral>({
  queryBuilder,
  objectMetadata,
  internalContext,
  authContext,
}: ApplyRecordVisibilityFilterArgs<T>): void => {
  const roleId = resolveRoleIdFromAuthContext({
    authContext,
    userWorkspaceRoleMap: internalContext.userWorkspaceRoleMap,
    apiKeyRoleMap: internalContext.apiKeyRoleMap,
  });

  if (!isDefined(roleId)) {
    return;
  }

  const policy =
    internalContext.recordVisibilityPoliciesByRoleId[roleId]?.[
      objectMetadata.id
    ];

  if (!isDefined(policy)) {
    return;
  }

  const memberId = isUserAuthContext(authContext)
    ? authContext.workspaceMemberId
    : undefined;

  const recordFilter = substituteCurrentMemberPlaceholder({
    filter: policy.filter,
    currentMemberFieldName: policy.currentMemberFieldName,
    memberId,
  });

  if (recordFilter === 'CANNOT_EVALUATE') {
    // The policy needs "current member" but this request has no member
    // (e.g. an API key) — fail closed rather than silently skip the filter.
    queryBuilder.andWhere('1 = 0');

    return;
  }

  if (!recordFilter || Object.keys(recordFilter).length === 0) {
    return;
  }

  const isUpdateOrDeleteQuery = ['update', 'soft-delete', 'delete'].includes(
    queryBuilder.expressionMap.queryType,
  );

  applyObjectRecordFilterToQueryBuilder({
    queryBuilder,
    objectNameSingular: objectMetadata.nameSingular,
    recordFilter,
    fieldParser: new GraphqlQueryFilterFieldParser(
      objectMetadata,
      internalContext.flatFieldMetadataMaps,
    ),
    useDirectTableReference: isUpdateOrDeleteQuery,
  });
};

const applyObjectRecordFilterToQueryBuilder = <T extends ObjectLiteral>({
  queryBuilder,
  objectNameSingular,
  recordFilter,
  fieldParser,
  useDirectTableReference = false,
}: {
  queryBuilder: WorkspaceSelectQueryBuilder<T>;
  objectNameSingular: string;
  recordFilter: Record<string, unknown>;
  fieldParser: GraphqlQueryFilterFieldParser;
  useDirectTableReference?: boolean;
}): void => {
  const outerQueryBuilderAsObjectLiteral =
    queryBuilder as WorkspaceSelectQueryBuilder<ObjectLiteral>;

  const whereCondition = new Brackets((qb) => {
    Object.entries(recordFilter).forEach(([key, value], index) => {
      parseKeyFilter({
        queryBuilder: qb,
        outerQueryBuilder: outerQueryBuilderAsObjectLiteral,
        objectNameSingular,
        key,
        value,
        isFirst: index === 0,
        fieldParser,
        useDirectTableReference,
      });
    });
  });

  if (queryBuilder.expressionMap.wheres.length === 0) {
    queryBuilder.where(whereCondition);
  } else {
    queryBuilder.andWhere(whereCondition);
  }
};

const parseKeyFilter = ({
  queryBuilder,
  outerQueryBuilder,
  objectNameSingular,
  key,
  value,
  isFirst,
  fieldParser,
  useDirectTableReference = false,
}: {
  queryBuilder: WhereExpressionBuilder;
  outerQueryBuilder: WorkspaceSelectQueryBuilder<ObjectLiteral>;
  objectNameSingular: string;
  key: string;
  // oxlint-disable-next-line typescript/no-explicit-any
  value: any;
  isFirst: boolean;
  fieldParser: GraphqlQueryFilterFieldParser;
  useDirectTableReference?: boolean;
}): void => {
  switch (key) {
    case 'and': {
      const andWhereCondition = new Brackets((qb) => {
        value.forEach((filter: Record<string, unknown>, index: number) => {
          const whereCondition = new Brackets((qb2) => {
            Object.entries(filter).forEach(
              ([subFilterKey, subFilterValue], subIndex) => {
                parseKeyFilter({
                  queryBuilder: qb2,
                  outerQueryBuilder,
                  objectNameSingular,
                  key: subFilterKey,
                  value: subFilterValue,
                  isFirst: subIndex === 0,
                  fieldParser,
                  useDirectTableReference,
                });
              },
            );
          });

          if (index === 0) {
            qb.where(whereCondition);
          } else {
            qb.andWhere(whereCondition);
          }
        });
      });

      if (isFirst) {
        queryBuilder.where(andWhereCondition);
      } else {
        queryBuilder.andWhere(andWhereCondition);
      }
      break;
    }
    case 'or': {
      const orWhereCondition = new Brackets((qb) => {
        value.forEach((filter: Record<string, unknown>, index: number) => {
          const whereCondition = new Brackets((qb2) => {
            Object.entries(filter).forEach(
              ([subFilterKey, subFilterValue], subIndex) => {
                parseKeyFilter({
                  queryBuilder: qb2,
                  outerQueryBuilder,
                  objectNameSingular,
                  key: subFilterKey,
                  value: subFilterValue,
                  isFirst: subIndex === 0,
                  fieldParser,
                  useDirectTableReference,
                });
              },
            );
          });

          if (index === 0) {
            qb.where(whereCondition);
          } else {
            qb.orWhere(whereCondition);
          }
        });
      });

      if (isFirst) {
        queryBuilder.where(orWhereCondition);
      } else {
        queryBuilder.andWhere(orWhereCondition);
      }

      break;
    }
    case 'not': {
      const notWhereCondition = new NotBrackets((qb) => {
        Object.entries(value).forEach(
          ([subFilterKey, subFilterValue], subIndex) => {
            parseKeyFilter({
              queryBuilder: qb,
              outerQueryBuilder,
              objectNameSingular,
              key: subFilterKey,
              value: subFilterValue,
              isFirst: subIndex === 0,
              fieldParser,
              useDirectTableReference,
            });
          },
        );
      });

      if (isFirst) {
        queryBuilder.where(notWhereCondition);
      } else {
        queryBuilder.andWhere(notWhereCondition);
      }

      break;
    }
    default:
      fieldParser.parse(
        queryBuilder,
        outerQueryBuilder,
        objectNameSingular,
        key,
        value,
        isFirst,
        useDirectTableReference,
      );
      break;
  }
};

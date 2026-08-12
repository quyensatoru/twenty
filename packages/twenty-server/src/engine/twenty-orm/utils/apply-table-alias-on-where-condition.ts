import { isArray, isObject, isString } from '@sniptt/guards';
import {
  type WhereClause,
  type WhereClauseCondition,
} from 'typeorm/query-builder/WhereClause';

type ApplyTableAliasOnWhereConditionParams = {
  condition: WhereClauseCondition;
  tableName: string;
  aliasName: string;
};

export const applyTableAliasOnWhereCondition = ({
  condition,
  tableName,
  aliasName,
}: ApplyTableAliasOnWhereConditionParams): WhereClauseCondition => {
  if (isString(condition)) {
    // Every `alias.` / `"alias".` prefix in the condition is rewritten, not
    // just the first one: a predicate can reference the same column twice
    // (`"x"."appId" IN (...) OR "x"."appId" IS NULL`), and rewriting only the
    // leading reference leaves the rest pointing at an alias the UPDATE/DELETE
    // statement doesn't have ("missing FROM-clause entry").
    // The lookbehind also makes this idempotent — in `"_listing".` the alias
    // is preceded by a word character, so an already-rewritten condition is
    // left alone instead of becoming `"__listing".`.
    const escapedAliasName = aliasName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return condition.replace(
      new RegExp(`(?<![\\w"])"?${escapedAliasName}"?\\.`, 'g'),
      (match) => (match.startsWith('"') ? `"${tableName}".` : `${tableName}.`),
    );
  }

  if (isArray(condition)) {
    return condition.map((where: WhereClause) => {
      return {
        ...where,
        condition: applyTableAliasOnWhereCondition({
          condition: where.condition,
          tableName,
          aliasName,
        }),
      };
    });
  }

  if (isObject(condition)) {
    if ('condition' in condition) {
      return {
        ...condition,
        condition: applyTableAliasOnWhereCondition({
          condition: condition.condition,
          tableName,
          aliasName,
        }),
      };
    }

    if ('operator' in condition) {
      return condition;
    }
  }

  return condition;
};

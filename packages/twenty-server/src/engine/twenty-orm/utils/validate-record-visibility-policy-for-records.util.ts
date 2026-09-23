import { type ObjectLiteral } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { substituteCurrentMemberPlaceholder } from 'src/engine/metadata-modules/record-visibility-policy/utils/substitute-current-member-placeholder.util';
import {
  TwentyOrmException,
  TwentyOrmExceptionCode,
} from 'src/engine/twenty-orm/exceptions/twenty-orm.exception';
import { doesRecordMatchFilter } from 'src/engine/twenty-orm/utils/does-record-match-filter.util';
import { resolveRoleIdsFromAuthContext } from 'src/engine/twenty-orm/utils/resolve-role-ids-from-auth-context.util';

// INSERT/UPDATE-side counterpart of apply-record-visibility-filter.util.ts —
// same spot the Enterprise RLS validate-rls-predicates-for-records.util.ts is
// called from, but generic: no per-object pre-query hook needed since a
// Record Visibility Policy only ever compares fields of the object it's
// attached to.
type ValidateRecordVisibilityPolicyForRecordsArgs<T extends ObjectLiteral> = {
  records: T[];
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
  shouldBypassPermissionChecks: boolean;
  errorMessage?: string;
};

export const validateRecordVisibilityPolicyForRecords = <
  T extends ObjectLiteral,
>({
  records,
  objectMetadata,
  internalContext,
  authContext,
  shouldBypassPermissionChecks,
  errorMessage = 'Record does not satisfy Record Visibility Policy constraints of your current role',
}: ValidateRecordVisibilityPolicyForRecordsArgs<T>): void => {
  if (shouldBypassPermissionChecks) {
    return;
  }

  const roleIds = resolveRoleIdsFromAuthContext({
    authContext,
    userWorkspaceRoleMap: internalContext.userWorkspaceRoleMap,
    apiKeyRoleMap: internalContext.apiKeyRoleMap,
  });

  if (roleIds.length === 0) {
    return;
  }

  const memberId = isUserAuthContext(authContext)
    ? authContext.workspaceMemberId
    : undefined;

  const throwValidationFailed = () => {
    throw new TwentyOrmException(
      errorMessage,
      TwentyOrmExceptionCode.RECORD_VISIBILITY_POLICY_VALIDATION_FAILED,
    );
  };

  // Every role's policy still applies — mirrors RLS's multi-role handling:
  // one role's restriction never gets widened away by another role lacking it.
  for (const roleId of roleIds) {
    const policy =
      internalContext.recordVisibilityPoliciesByRoleId[roleId]?.[
        objectMetadata.id
      ];

    if (!isDefined(policy)) {
      continue;
    }

    const recordFilter = substituteCurrentMemberPlaceholder({
      filter: policy.filter,
      currentMemberFieldName: policy.currentMemberFieldName,
      memberId,
    });

    if (recordFilter === 'CANNOT_EVALUATE') {
      throwValidationFailed();

      return;
    }

    if (!recordFilter || Object.keys(recordFilter).length === 0) {
      continue;
    }

    for (const record of records) {
      const matches = doesRecordMatchFilter({
        record,
        filter: recordFilter,
        objectMetadata,
        flatFieldMetadataMaps: internalContext.flatFieldMetadataMaps,
      });

      if (!matches) {
        throwValidationFailed();
      }
    }
  }
};

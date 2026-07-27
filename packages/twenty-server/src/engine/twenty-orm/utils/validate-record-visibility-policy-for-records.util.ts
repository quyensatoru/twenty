import { type ObjectLiteral } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { substituteCurrentMemberPlaceholder } from 'src/engine/metadata-modules/record-visibility-policy/utils/substitute-current-member-placeholder.util';
import {
  TwentyORMException,
  TwentyORMExceptionCode,
} from 'src/engine/twenty-orm/exceptions/twenty-orm.exception';
import { doesRecordMatchFilter } from 'src/engine/twenty-orm/utils/does-record-match-filter.util';
import { resolveRoleIdFromAuthContext } from 'src/engine/twenty-orm/utils/resolve-role-id-from-auth-context.util';

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

  const throwValidationFailed = () => {
    throw new TwentyORMException(
      errorMessage,
      TwentyORMExceptionCode.RECORD_VISIBILITY_POLICY_VALIDATION_FAILED,
    );
  };

  if (recordFilter === 'CANNOT_EVALUATE') {
    throwValidationFailed();

    return;
  }

  if (!recordFilter || Object.keys(recordFilter).length === 0) {
    return;
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
};

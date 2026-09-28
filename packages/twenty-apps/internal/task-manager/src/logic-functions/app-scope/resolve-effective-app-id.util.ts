import {
  APP_SCOPE_PATH_BY_OBJECT,
  HOP_TARGET_BY_FIELD_NAME,
  PLURAL_NAME_BY_OBJECT,
} from '../../constants/app-scope-paths';
import { type ApiClient } from '../../types/api-client';
import { fetchRecordColumn } from '../utils/fetch-record-column.util';

const toJoinColumnName = (fieldName: string): string => `${fieldName}Id`;

// Resolves the effective `app` id of a record being written, given the value
// of its immediate foreign key.
//   scopePath === []  the object holds `appId` itself, so the value passed in
//                     already IS the app id
//   scopePath  > []   walk the remaining chain row by row down to the
//                     app-scope root, then read that row's `appId`
// Returns null when the chain breaks, which every caller treats as "denied".
export const resolveEffectiveAppId = async ({
  client,
  objectNameSingular,
  immediateForeignKeyValue,
}: {
  client: ApiClient;
  objectNameSingular: string;
  immediateForeignKeyValue: string;
}): Promise<string | null> => {
  const scopePath = APP_SCOPE_PATH_BY_OBJECT[objectNameSingular];

  if (!Array.isArray(scopePath)) {
    return null;
  }

  if (scopePath.length === 0) {
    return immediateForeignKeyValue;
  }

  let currentObjectNameSingular = HOP_TARGET_BY_FIELD_NAME[scopePath[0]];
  let currentId: string | null = immediateForeignKeyValue;

  for (let hopIndex = 1; hopIndex < scopePath.length; hopIndex++) {
    if (currentId === null || currentObjectNameSingular === undefined) {
      return null;
    }

    const pluralName = PLURAL_NAME_BY_OBJECT[currentObjectNameSingular];

    if (pluralName === undefined) {
      return null;
    }

    currentId = await fetchRecordColumn(
      client,
      pluralName,
      currentId,
      toJoinColumnName(scopePath[hopIndex]),
    );

    currentObjectNameSingular = HOP_TARGET_BY_FIELD_NAME[scopePath[hopIndex]];
  }

  if (currentId === null || currentObjectNameSingular === undefined) {
    return null;
  }

  const rootPluralName = PLURAL_NAME_BY_OBJECT[currentObjectNameSingular];

  if (rootPluralName === undefined) {
    return null;
  }

  return fetchRecordColumn(client, rootPluralName, currentId, 'appId');
};

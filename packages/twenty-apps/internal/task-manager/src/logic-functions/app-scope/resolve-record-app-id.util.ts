import {
  APP_SCOPE_PATH_BY_OBJECT,
  HOP_TARGET_BY_FIELD_NAME,
  PLURAL_NAME_BY_OBJECT,
} from '../../constants/app-scope-paths';
import { type ApiClient } from '../../types/api-client';
import { fetchRecordColumn } from '../utils/fetch-record-column.util';

// Resolves the effective `app` id of an EXISTING record, walking the object's
// scope path row by row. resolveEffectiveAppId is the write-side twin: it
// starts from a foreign key value that is not on any row yet.
// Returns null when the object is unscoped or the chain breaks; callers treat
// null as "denied", since nothing this app owns is visible while unassigned.
export const resolveRecordAppId = async ({
  client,
  objectNameSingular,
  recordId,
}: {
  client: ApiClient;
  objectNameSingular: string;
  recordId: string;
}): Promise<string | null> => {
  const scopePath = APP_SCOPE_PATH_BY_OBJECT[objectNameSingular];

  if (scopePath === 'IS_APP_ITSELF') {
    return recordId;
  }

  if (!Array.isArray(scopePath)) {
    return null;
  }

  let currentObjectNameSingular: string | undefined = objectNameSingular;
  let currentId: string | null = recordId;

  for (const fieldName of scopePath) {
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
      `${fieldName}Id`,
    );
    currentObjectNameSingular = HOP_TARGET_BY_FIELD_NAME[fieldName];
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

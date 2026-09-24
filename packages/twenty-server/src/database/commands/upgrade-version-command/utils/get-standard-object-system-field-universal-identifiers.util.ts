import { isDefined } from 'twenty-shared/utils';

const SYSTEM_FIELD_NAMES = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'position',
  'searchVector',
] as const;

// The legacy migration path injects nothing, so a command creating a standard
// object must list the system fields the side-effect engine used to add.
export const getStandardObjectSystemFieldUniversalIdentifiers = (
  fields: Record<string, { universalIdentifier: string }>,
): string[] =>
  SYSTEM_FIELD_NAMES.flatMap((fieldName) => {
    const field = fields[fieldName];

    return isDefined(field) ? [field.universalIdentifier] : [];
  });

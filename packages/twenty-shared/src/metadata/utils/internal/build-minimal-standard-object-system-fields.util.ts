import { buildStandardObjectSystemFields } from '@/metadata/utils/internal/build-standard-object-system-fields.util';

// Some standard objects (e.g. app/appAccess) are minimal lookup /
// permission-grant objects, not activity-tracked records, so they omit
// createdBy/updatedBy/position. searchVector IS still required though —
// Twenty's generic relation-picker/search infrastructure unconditionally
// queries a `searchVector` column for any object that can appear as a
// relation target, regardless of whether the object is globally searchable;
// omitting it causes a "column does not exist" error the moment a user tries
// to pick a record of this type in a relation field. IDs are derived
// deterministically via buildStandardObjectSystemFields (never hand-written)
// — only a subset of the derived fields is kept.
export const buildMinimalStandardObjectSystemFields = (
  objectUniversalIdentifier: string,
): Record<
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'searchVector',
  { universalIdentifier: string }
> => {
  const { id, createdAt, updatedAt, deletedAt, searchVector } =
    buildStandardObjectSystemFields(objectUniversalIdentifier);

  return { id, createdAt, updatedAt, deletedAt, searchVector };
};

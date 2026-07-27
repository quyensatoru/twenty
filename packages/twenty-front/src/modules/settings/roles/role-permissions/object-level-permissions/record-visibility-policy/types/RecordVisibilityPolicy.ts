// Hand-written mirror of the backend RecordVisibilityPolicyDTO — not present
// in ~/generated-metadata/graphql yet because it's produced by
// `nx run twenty-front:graphql:generate --configuration=metadata`, which
// needs a running server reflecting the new schema. Re-run codegen and
// delete this file (switching imports to the generated type) once available.
// oxlint-disable-next-line typescript/no-explicit-any
export type RecordVisibilityPolicyFilter = Record<string, any>;

export type RecordVisibilityPolicy = {
  __typename?: 'RecordVisibilityPolicy';
  id: string;
  roleId: string;
  objectMetadataId: string;
  filter: RecordVisibilityPolicyFilter;
  currentMemberFieldName?: string | null;
};

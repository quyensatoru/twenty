import { RECORD_VISIBILITY_POLICY_CURRENT_MEMBER_PLACEHOLDER } from 'twenty-shared/constants';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Deep-walks `filter`, replacing every occurrence of the
// "$$CURRENT_MEMBER$$" placeholder (a leaf string value, wherever it
// appears — e.g. inside a relation field's `{ in: [...] }` array) with
// `memberId`. Returns 'CANNOT_EVALUATE' when the policy needs the
// placeholder resolved (`currentMemberFieldName` set) but no member id is
// available for this auth context (e.g. an API key) — the caller must fail
// closed rather than leave the raw placeholder in the query, which would
// either never match or throw a SQL type error against a uuid column.
export const substituteCurrentMemberPlaceholder = ({
  filter,
  currentMemberFieldName,
  memberId,
}: {
  filter: RecordGqlOperationFilter;
  currentMemberFieldName: string | null;
  memberId: string | undefined;
}): RecordGqlOperationFilter | 'CANNOT_EVALUATE' => {
  if (!isDefined(currentMemberFieldName)) {
    return filter;
  }

  if (!isDefined(memberId)) {
    return 'CANNOT_EVALUATE';
  }

  return deepSubstitute(filter, memberId) as RecordGqlOperationFilter;
};

// oxlint-disable-next-line typescript/no-explicit-any
const deepSubstitute = (value: any, memberId: string): any => {
  if (value === RECORD_VISIBILITY_POLICY_CURRENT_MEMBER_PLACEHOLDER) {
    return memberId;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepSubstitute(item, memberId));
  }

  if (isDefined(value) && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, subValue]) => [
        key,
        deepSubstitute(subValue, memberId),
      ]),
    );
  }

  return value;
};

// Sentinel value the Record Visibility Policy filter builder writes into a
// relation field's filter value (e.g. `{ assignee: { in: [RECORD_VISIBILITY_POLICY_CURRENT_MEMBER_PLACEHOLDER] } }`)
// to mean "compare against whichever workspace member is making the request"
// rather than a fixed member id. The server substitutes it for the real
// workspaceMember.id at query time — see apply-record-visibility-filter.util.ts.
export const RECORD_VISIBILITY_POLICY_CURRENT_MEMBER_PLACEHOLDER =
  '$$CURRENT_MEMBER$$';

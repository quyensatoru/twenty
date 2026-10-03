-- Áp phạm vi app của Task Manager lên các role workspace có sẵn (CSE, Dev…),
-- thay vì chuyển người sang role "Task Manager member".
--
--   psql "$DATABASE_URL" -v roles="'CSE','Dev','BD'" --single-transaction -f 08-scope-existing-roles.sql
--   rồi: node dist/command/command.js cache:flush
--
-- Một member chỉ giữ được một role (unique index trên roleTarget), nên chuyển
-- sang "Task Manager member" là mất quyền khác của CSE/Dev. Ở đây chép đúng
-- các predicate của "Task Manager member" — `app` của bản ghi IS
-- `scopedAppIds` của người xem, trên project, merchant, issue, sprint, epic,
-- issueStatus, issueComment, worklog, issueMerchant, issueHistory — sang các
-- role được nêu. Quyền object của các role đó giữ nguyên.
--
-- Predicate mới thuộc application "Custom" như chính role, nên sửa được trong
-- Settings → Roles. universalIdentifier dẫn xuất từ (role, predicate nguồn):
-- chạy lại không tạo trùng.

\set ON_ERROR_STOP on

\if :{?roles}
\else
  \echo 'Thieu -v roles="''CSE'',''Dev''"'
  \quit
\endif

INSERT INTO core."rowLevelPermissionPredicate" (
  "universalIdentifier", "applicationId", "fieldMetadataId", "objectMetadataId",
  "operand", "value", "subFieldName", "workspaceMemberFieldMetadataId",
  "workspaceMemberSubFieldName", "workspaceId", "roleId"
)
SELECT
  md5(target_role.id::text || ':' || source."universalIdentifier"::text)::uuid,
  target_role."applicationId",
  source."fieldMetadataId",
  source."objectMetadataId",
  source.operand,
  source.value,
  source."subFieldName",
  source."workspaceMemberFieldMetadataId",
  source."workspaceMemberSubFieldName",
  source."workspaceId",
  target_role.id
FROM core."rowLevelPermissionPredicate" source
JOIN core.role source_role
  ON source_role.id = source."roleId" AND source_role.label = 'Task Manager member'
JOIN core.role target_role
  ON target_role."workspaceId" = source."workspaceId"
 AND target_role.label IN (:roles)
WHERE source."deletedAt" IS NULL
  AND source."rowLevelPermissionPredicateGroupId" IS NULL
ON CONFLICT ("workspaceId", "universalIdentifier") DO NOTHING;

-- Mỗi role phải có đủ 10 predicate.
SELECT r.label, count(p.*) AS app_scope_predicates
FROM core.role r
LEFT JOIN core."rowLevelPermissionPredicate" p
  ON p."roleId" = r.id AND p."deletedAt" IS NULL
WHERE r.label IN (:roles) OR r.label = 'Task Manager member'
GROUP BY r.label
ORDER BY r.label;

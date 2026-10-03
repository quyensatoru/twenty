-- Sau `twenty apply` của task-manager: đưa timeline của fork vào tab History
-- (`issueHistory`), đúng hai loại sự kiện app tự ghi từ nay.
--
--   psql "$DATABASE_URL" --single-transaction -v schema=workspace_xxxxxxxx -f 06-restore-issue-history.sql
--
-- Nguồn là `timelineActivity` qua `_cutover_link_timelineActivity_targetIssueId`
-- (do 04 tạo), vì nhánh morph targetIssue không còn sau cutover:
--   recordCreated                    -> action `created`
--   recordUpdated có diff.status đổi -> action `status-changed`, from/to là id
--                                       status như on-issue-updated ghi
-- Các thay đổi khác (assignee, title, description…) app không ghi vào History
-- nên không chuyển; chúng vẫn nằm nguyên trong `timelineActivity`.
--
-- id của dòng History lấy đúng id timelineActivity nguồn, nên chạy lại không
-- tạo trùng. `appId` để trống: route sync-app-scope-mirror điền nó từ issue.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

INSERT INTO :"schema"."_issueHistory" (
  "id", "issueId", "action", "fromStatusId", "toStatusId", "authorId",
  "createdAt", "updatedAt", "position",
  "createdByWorkspaceMemberId", "createdByName", "updatedByWorkspaceMemberId", "updatedByName"
)
SELECT
  activity.id,
  issue.id,
  CASE activity."timelineActivityTypeSnapshot"->>'name'
    WHEN 'recordCreated' THEN 'created'
    ELSE 'status-changed'
  END,
  CASE WHEN activity."timelineActivityTypeSnapshot"->>'name' = 'recordUpdated'
    THEN activity.properties->'diff'->'status'->'before'->>'id' END,
  CASE WHEN activity."timelineActivityTypeSnapshot"->>'name' = 'recordUpdated'
    THEN activity.properties->'diff'->'status'->'after'->>'id' END,
  coalesce(
    activity."workspaceMemberId",
    CASE WHEN activity."timelineActivityTypeSnapshot"->>'name' = 'recordCreated'
      THEN issue."reporterId" END
  ),
  activity."happensAt",
  activity."happensAt",
  0,
  activity."createdByWorkspaceMemberId",
  activity."createdByName",
  activity."createdByWorkspaceMemberId",
  activity."createdByName"
FROM :"schema"."_cutover_link_timelineActivity_targetIssueId" link
JOIN :"schema"."timelineActivity" activity
  ON activity.id = link.source_id AND activity."deletedAt" IS NULL
JOIN :"schema"."_issue" issue ON issue.id = link.target_id
WHERE (
    activity."timelineActivityTypeSnapshot"->>'name' = 'recordCreated'
    OR (
      activity."timelineActivityTypeSnapshot"->>'name' = 'recordUpdated'
      AND activity.properties->'diff' ? 'status'
      AND (activity.properties->'diff'->'status'->'before'->>'id')
        IS DISTINCT FROM (activity.properties->'diff'->'status'->'after'->>'id')
    )
  )
  -- Issue nào app đã ghi `created` (tạo sau cutover) thì không thêm lần nữa.
  AND NOT (
    activity."timelineActivityTypeSnapshot"->>'name' = 'recordCreated'
    AND EXISTS (
      SELECT 1 FROM :"schema"."_issueHistory" existing
      WHERE existing."issueId" = issue.id AND existing.action = 'created'
    )
  )
ON CONFLICT (id) DO NOTHING;

SELECT action, count(*) AS rows, count(DISTINCT "issueId") AS issues
FROM :"schema"."_issueHistory"
GROUP BY action
ORDER BY action;

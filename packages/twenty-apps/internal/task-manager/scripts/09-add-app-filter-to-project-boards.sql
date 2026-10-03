-- Cho các view issue lọc theo đúng một project (Kanban người dùng dựng trên
-- fork) thêm bộ lọc App = app của project đó.
--
--   psql "$DATABASE_URL" --single-transaction -v schema=workspace_xxxxxxxx -f 09-add-app-filter-to-project-boards.sql
--   rồi: node dist/command/command.js cache:flush
--
-- Bộ lọc của view là thứ điền giá trị cho card mới tạo từ view. Chỉ có
-- `project` thì card mới mang project nhưng không có app, và predicate phạm vi
-- app của role (CSE, Dev, BD, Task Manager member) từ chối ghi một dòng mà app
-- của nó không thuộc người tạo: tạo issue từ Kanban báo lỗi. Board do app dựng
-- (create-project-board-view.util.ts) đã mang sẵn hai bộ lọc; đây là phần bù
-- cho view cũ.
--
-- Idempotent: universalIdentifier dẫn xuất từ id của view, view đã có bộ lọc
-- App thì bỏ qua.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

WITH issue_object AS (
  SELECT o.id, o."workspaceId"
  FROM core."objectMetadata" o
  WHERE o."universalIdentifier" = 'e14a5928-2bbe-4e20-b766-ea8975ee819f'
),
issue_fields AS (
  SELECT
    issue_object.id AS object_id,
    max(f.id::text) FILTER (WHERE f.name = 'project')::uuid AS project_field_id,
    max(f.id::text) FILTER (WHERE f.name = 'app')::uuid AS app_field_id
  FROM issue_object
  JOIN core."fieldMetadata" f ON f."objectMetadataId" = issue_object.id
  GROUP BY issue_object.id
),
project_filter AS (
  SELECT
    vf."viewId",
    v."applicationId",
    v."workspaceId",
    issue_fields.app_field_id,
    CASE jsonb_typeof(vf.value)
      WHEN 'string' THEN (vf.value #>> '{}')::jsonb
      ELSE vf.value
    END -> 'selectedRecordIds' AS selected_project_ids
  FROM core."viewFilter" vf
  JOIN core.view v ON v.id = vf."viewId" AND v."deletedAt" IS NULL
  JOIN issue_fields ON issue_fields.object_id = v."objectMetadataId"
  WHERE vf."deletedAt" IS NULL
    AND vf."fieldMetadataId" = issue_fields.project_field_id
    AND vf.operand = 'IS'
    AND vf."viewFilterGroupId" IS NULL
),
board AS (
  SELECT
    project_filter.*,
    project."appId" AS app_id
  FROM project_filter
  JOIN LATERAL (
    SELECT p."appId"
    FROM :"schema"."_project" p
    WHERE p.id = (project_filter.selected_project_ids ->> 0)::uuid
  ) project ON true
  WHERE jsonb_array_length(project_filter.selected_project_ids) = 1
    AND project."appId" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM core."viewFilter" existing
      WHERE existing."viewId" = project_filter."viewId"
        AND existing."fieldMetadataId" = project_filter.app_field_id
        AND existing."deletedAt" IS NULL
    )
)
INSERT INTO core."viewFilter" (
  "universalIdentifier", "fieldMetadataId", "operand", "value", "viewId",
  "workspaceId", "applicationId"
)
SELECT
  md5(board."viewId"::text || ':app-filter')::uuid,
  board.app_field_id,
  'IS',
  jsonb_build_object(
    'isCurrentWorkspaceMemberSelected', false,
    'selectedRecordIds', jsonb_build_array(board.app_id)
  ),
  board."viewId",
  board."workspaceId",
  board."applicationId"
FROM board
ON CONFLICT DO NOTHING;

-- Mỗi view lọc một project phải có bộ lọc App tương ứng.
SELECT v.name AS view, project.name AS project, app.name AS app_filter
FROM core.view v
JOIN core."viewFilter" vf ON vf."viewId" = v.id AND vf."deletedAt" IS NULL
JOIN core."fieldMetadata" f ON f.id = vf."fieldMetadataId" AND f.name = 'app'
JOIN core."objectMetadata" o ON o.id = v."objectMetadataId"
  AND o."universalIdentifier" = 'e14a5928-2bbe-4e20-b766-ea8975ee819f'
LEFT JOIN :"schema"."_app" app
  ON app.id = (vf.value -> 'selectedRecordIds' ->> 0)::uuid
LEFT JOIN :"schema"."_project" project
  ON project."appId" = app.id AND project.id IN (
    SELECT (CASE jsonb_typeof(pf.value) WHEN 'string' THEN (pf.value #>> '{}')::jsonb ELSE pf.value END
            -> 'selectedRecordIds' ->> 0)::uuid
    FROM core."viewFilter" pf
    JOIN core."fieldMetadata" pff ON pff.id = pf."fieldMetadataId" AND pff.name = 'project'
    WHERE pf."viewId" = v.id AND pf."deletedAt" IS NULL
  )
WHERE v."deletedAt" IS NULL
ORDER BY v.name;

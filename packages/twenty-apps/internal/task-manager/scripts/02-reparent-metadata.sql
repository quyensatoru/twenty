-- Bước 2 của CUTOVER.md — chuyển chủ sở hữu metadata của 11 object task-manager
-- từ Twenty standard application sang application Task Manager.
--
--   psql "$DATABASE_URL" -f 02-reparent-metadata.sql
--
-- Chạy trên server FORK, sau 01-create-applications.sql, trước khi deploy
-- nhánh apps/zero-core. Chạy cho MỌI workspace trong một transaction.
-- Idempotent: chạy lại là no-op.
--
-- Chỉ đụng vào bốn bảng: objectMetadata, fieldMetadata, indexMetadata,
-- searchFieldMetadata. Đó là toàn bộ metadata quyết định bảng vật lý và các cột
-- có tồn tại hay không. Mọi bảng khác có cột applicationId (view, viewField,
-- viewGroup, viewFieldGroup, pageLayout*, navigationMenuItem) chỉ là phần trình
-- bày, app ship lại bằng universalIdentifier mới — re-parent chúng sang app
-- cũng chỉ để `twenty apply` xoá đi ở bước sau. Xem MIGRATION.md mục 4.
--
-- Mọi UPDATE đều lọc `applicationId = <standard>`. Đó là cách giữ nguyên các
-- field mà merchant-email-campaigns sở hữu trên `merchant` (email, contactName,
-- emailUnsubscribed, emailUnsubscribedAt và các quan hệ của nó): chúng thuộc
-- application khác nên nằm ngoài mọi mệnh đề WHERE dưới đây.

\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE reparent_object_uid (universal_identifier uuid PRIMARY KEY) ON COMMIT DROP;

INSERT INTO reparent_object_uid VALUES
  ('4d71d304-ea37-457c-9422-48812659d75e'),  -- app
  ('467cc684-c385-4536-bd9a-dfdf80c2d60f'),  -- appAccess
  ('5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'),  -- merchant
  ('bf773e17-d100-40b8-9e8d-ef476c1d2fb8'),  -- project
  ('6acc95fa-4a04-49f1-ac53-50efe1032cbf'),  -- sprint
  ('4aef1443-d2b0-42a9-9ce9-f08891b93430'),  -- epic
  ('3439277b-2995-4a5c-b497-1b75396533a4'),  -- issueStatus
  ('e14a5928-2bbe-4e20-b766-ea8975ee819f'),  -- issue
  ('a469cd28-a0f7-4132-8f5d-d89fa044f516'),  -- issueMerchant
  ('860287e4-e447-4e1b-85e4-4952c02f57dd'),  -- issueComment
  ('8e4d81e8-6ab8-42c4-9e61-16b98bab83fa');  -- worklog

-- Tám quan hệ ngược mà fork thêm vào standard object `workspaceMember`. Chúng
-- nằm trên một object KHÔNG chuyển chủ, nên phải liệt kê riêng: bỏ sót thì
-- standard sync thấy chúng thừa so với manifest upstream và xoá, kéo theo cả
-- vế MANY_TO_ONE bên project/issue/epic/sprint/issueComment/worklog/appAccess.
CREATE TEMP TABLE reparent_field_uid (universal_identifier uuid PRIMARY KEY) ON COMMIT DROP;

INSERT INTO reparent_field_uid VALUES
  ('7fc50f3f-4899-47ea-b2a7-16be876df920'),  -- workspaceMember.ledProjects
  ('927b149b-b4f0-4805-b867-42609cd029c6'),  -- workspaceMember.assignedIssues
  ('664aacfe-c0e0-49b1-8f1f-f8cfab07cf2f'),  -- workspaceMember.reportedIssues
  ('a5f85db6-3ecb-47bd-8dd3-854a3fdb0160'),  -- workspaceMember.assignedEpics
  ('efcc2e97-f62b-4994-8c14-84053fd0d67c'),  -- workspaceMember.ownedSprints
  ('da781bbf-a15e-4948-9712-3dcc14ab5545'),  -- workspaceMember.issueComments
  ('c0bf79c9-1bbd-438a-b4de-3a0a7960e212'),  -- workspaceMember.worklogs
  ('288d8f20-66ea-40e6-afc8-f2c73aa18d99');  -- workspaceMember.appAccesses

-- (workspaceId -> application nguồn, application đích)
DROP TABLE IF EXISTS reparent_target;
CREATE TEMP TABLE reparent_target AS
SELECT
  task."workspaceId"       AS workspace_id,
  standard."id"            AS from_application_id,
  task."id"                AS to_application_id
FROM core."application" task
JOIN core."application" standard
  ON standard."workspaceId" = task."workspaceId"
 AND standard."universalIdentifier" = '20202020-64aa-4b6f-b003-9c74b97cee20'::uuid
 AND standard."deletedAt" IS NULL
WHERE task."universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'::uuid
  AND task."deletedAt" IS NULL;

-- Dừng ngay nếu thiếu dòng application: đi tiếp là re-parent nửa vời.
DO $$
DECLARE
  workspace_count integer;
  target_count integer;
BEGIN
  SELECT count(*) INTO workspace_count FROM core."workspace" WHERE "deletedAt" IS NULL;
  SELECT count(*) INTO target_count FROM reparent_target;

  IF target_count <> workspace_count THEN
    RAISE EXCEPTION
      'Co % workspace nhung chi % workspace co ca hai application. Chay 01-create-applications.sql truoc.',
      workspace_count, target_count;
  END IF;
END $$;

-- Các object sắp chuyển, đã phân giải ra id thật.
DROP TABLE IF EXISTS reparent_object;
CREATE TEMP TABLE reparent_object AS
SELECT om."id" AS object_metadata_id, t.workspace_id, t.to_application_id
FROM core."objectMetadata" om
JOIN reparent_target t ON t.workspace_id = om."workspaceId"
JOIN reparent_object_uid u ON u.universal_identifier = om."universalIdentifier"
WHERE om."applicationId" = t.from_application_id;

-- 1. objectMetadata — bước quyết định. Sau lệnh này object nằm ngoài tầm nhìn
--    của standard sync, nên bảng vật lý không bị DROP khi server mới khởi động.
UPDATE core."objectMetadata" om
SET "applicationId" = r.to_application_id
FROM reparent_object r
WHERE om."id" = r.object_metadata_id;

-- 2. fieldMetadata của các object đó (chỉ những field standard đang sở hữu).
UPDATE core."fieldMetadata" fm
SET "applicationId" = r.to_application_id
FROM reparent_object r
JOIN reparent_target t ON t.workspace_id = r.workspace_id
WHERE fm."objectMetadataId" = r.object_metadata_id
  AND fm."applicationId" = t.from_application_id;

-- 3. Tám quan hệ ngược trên workspaceMember.
UPDATE core."fieldMetadata" fm
SET "applicationId" = t.to_application_id
FROM reparent_target t
JOIN reparent_field_uid u ON TRUE
WHERE fm."workspaceId" = t.workspace_id
  AND fm."universalIdentifier" = u.universal_identifier
  AND fm."applicationId" = t.from_application_id;

-- 4. indexMetadata. indexFieldMetadata KHÔNG có cột applicationId, nó đi theo
--    indexMetadata qua indexMetadataId nên không cần đụng tới.
UPDATE core."indexMetadata" im
SET "applicationId" = r.to_application_id
FROM reparent_object r
JOIN reparent_target t ON t.workspace_id = r.workspace_id
WHERE im."objectMetadataId" = r.object_metadata_id
  AND im."applicationId" = t.from_application_id;

-- 5. searchFieldMetadata (cột searchVector của app, issue, merchant, appAccess).
UPDATE core."searchFieldMetadata" sfm
SET "applicationId" = r.to_application_id
FROM reparent_object r
JOIN reparent_target t ON t.workspace_id = r.workspace_id
WHERE sfm."objectMetadataId" = r.object_metadata_id
  AND sfm."applicationId" = t.from_application_id;

-- ĐỐI CHIẾU — đọc kỹ trước khi COMMIT.

-- Phải ra đúng 11 dòng cho mỗi workspace, applicationId là Task Manager.
SELECT om."workspaceId", count(*) AS objects_reparented
FROM core."objectMetadata" om
JOIN core."application" a ON a."id" = om."applicationId"
JOIN reparent_object_uid u ON u.universal_identifier = om."universalIdentifier"
WHERE a."universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'::uuid
GROUP BY om."workspaceId"
ORDER BY om."workspaceId";

-- Phải ra 0 dòng: không còn field nào của 11 object thuộc standard application.
SELECT om."nameSingular", fm."name", fm."universalIdentifier"
FROM core."fieldMetadata" fm
JOIN core."objectMetadata" om ON om."id" = fm."objectMetadataId"
JOIN reparent_object_uid u ON u.universal_identifier = om."universalIdentifier"
JOIN core."application" a ON a."id" = fm."applicationId"
WHERE a."universalIdentifier" = '20202020-64aa-4b6f-b003-9c74b97cee20'::uuid
ORDER BY om."nameSingular", fm."name";

-- Phải ra 8 dòng cho mỗi workspace, thuộc Task Manager.
SELECT fm."workspaceId", fm."name", a."name" AS owner
FROM core."fieldMetadata" fm
JOIN reparent_field_uid u ON u.universal_identifier = fm."universalIdentifier"
JOIN core."application" a ON a."id" = fm."applicationId"
ORDER BY fm."workspaceId", fm."name";

-- Phải còn nguyên: các field merchant-email-campaigns sở hữu trên `merchant`
-- vẫn thuộc application của nó, không bị kéo sang Task Manager.
SELECT fm."name", a."name" AS owner
FROM core."fieldMetadata" fm
JOIN core."objectMetadata" om ON om."id" = fm."objectMetadataId"
JOIN core."application" a ON a."id" = fm."applicationId"
WHERE om."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'::uuid
  AND a."universalIdentifier" <> '819550d5-882b-4b96-8afd-b02e0d2b41c1'::uuid
ORDER BY fm."name";


-- ---------------------------------------------------------------------------
-- View và con của view.
--
-- Thiếu khối này thì `twenty apply` dừng với
--   ENTITY_ALREADY_EXISTS: ... already exists in view maps from application
--   "20202020-64aa-4b6f-b003-9c74b97cee20"
-- vì view cũ vẫn thuộc twenty-standard còn app thì cố tạo mới cùng
-- universalIdentifier.
-- ---------------------------------------------------------------------------

WITH owner AS (
  SELECT "id" FROM core."application"
   WHERE "universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'
),
owned_objects AS (
  SELECT "id" FROM core."objectMetadata"
   WHERE "applicationId" = (SELECT "id" FROM owner)
)
UPDATE core."view" v
   SET "applicationId" = (SELECT "id" FROM owner)
 WHERE v."objectMetadataId" IN (SELECT "id" FROM owned_objects)
   AND v."applicationId" <> (SELECT "id" FROM owner);

WITH owner AS (
  SELECT "id" FROM core."application"
   WHERE "universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'
),
owned_views AS (
  SELECT "id" FROM core."view"
   WHERE "applicationId" = (SELECT "id" FROM owner)
)
UPDATE core."viewField" f
   SET "applicationId" = (SELECT "id" FROM owner)
 WHERE f."viewId" IN (SELECT "id" FROM owned_views)
   AND f."applicationId" <> (SELECT "id" FROM owner);

WITH owner AS (
  SELECT "id" FROM core."application"
   WHERE "universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'
),
owned_views AS (
  SELECT "id" FROM core."view"
   WHERE "applicationId" = (SELECT "id" FROM owner)
)
UPDATE core."viewGroup" g
   SET "applicationId" = (SELECT "id" FROM owner)
 WHERE g."viewId" IN (SELECT "id" FROM owned_views)
   AND g."applicationId" <> (SELECT "id" FROM owner);

WITH owner AS (
  SELECT "id" FROM core."application"
   WHERE "universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'
),
owned_views AS (
  SELECT "id" FROM core."view"
   WHERE "applicationId" = (SELECT "id" FROM owner)
)
UPDATE core."viewSort" s
   SET "applicationId" = (SELECT "id" FROM owner)
 WHERE s."viewId" IN (SELECT "id" FROM owned_views)
   AND s."applicationId" <> (SELECT "id" FROM owner);

WITH owner AS (
  SELECT "id" FROM core."application"
   WHERE "universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'
),
owned_views AS (
  SELECT "id" FROM core."view"
   WHERE "applicationId" = (SELECT "id" FROM owner)
)
UPDATE core."viewFilter" fl
   SET "applicationId" = (SELECT "id" FROM owner)
 WHERE fl."viewId" IN (SELECT "id" FROM owned_views)
   AND fl."applicationId" <> (SELECT "id" FROM owner);

-- ---------------------------------------------------------------------------
-- Cờ isSystem.
--
-- Fork đánh dấu junction issueMerchant và project.nextIssueNumber là system để
-- giấu khỏi UI. App sync từ chối sửa system object/field, nên phải gỡ cờ.
-- HỆ QUẢ: issueMerchant sẽ hiện trong UI thay vì ẩn.
-- ---------------------------------------------------------------------------

UPDATE core."objectMetadata"
   SET "isSystem" = false
 WHERE "universalIdentifier" = 'a469cd28-a0f7-4132-8f5d-d89fa044f516'
   AND "isSystem";

UPDATE core."fieldMetadata"
   SET "isSystem" = false
 WHERE "universalIdentifier" = 'cf46bf2b-8c71-4925-9533-9abc7d2e57cb'
   AND "isSystem";

COMMIT;

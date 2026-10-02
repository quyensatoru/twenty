-- Bước 2 — chuyển chủ sở hữu metadata của `merchant` từ Task Manager sang
-- Customer Support.
--
--   psql "$DATABASE_URL" -f 02-reparent-merchant.sql
--
-- Chạy sau 01-create-application.sql, TRƯỚC mọi `twenty apply`. Thứ tự này
-- không thương lượng được: đã kiểm chứng bằng `twenty plan` trên task-manager
-- sau khi gỡ merchant khỏi manifest, output là
--   - objectMetadata "merchant" — drops the table and all its rows
-- Re-parent trước thì object nằm ngoài tầm nhìn diff của task-manager và lệnh
-- xoá đó không còn được sinh ra.
--
-- Chỉ đụng bốn bảng metadata quyết định bảng vật lý — objectMetadata,
-- fieldMetadata, indexMetadata, searchFieldMetadata — theo đúng cách
-- ../task-manager/scripts/02-reparent-metadata.sql đã làm. `view`, `viewField`
-- và `navigationMenuItem` là phần trình bày: app khai lại chúng bằng chính
-- universalIdentifier cũ, nên không re-parent ở đây. indexFieldMetadata không
-- có cột applicationId, nó đi theo indexMetadata.
--
-- MỌI UPDATE ĐỀU LỌC `applicationId = <Task Manager>`. Đó là thứ giữ nguyên 6
-- field mà merchant-email-campaigns sở hữu trên `merchant` (email, contactName,
-- emailSends, emailUnsubscribed, emailUnsubscribedAt, merchantEvents): chúng
-- thuộc application khác nên nằm ngoài mọi mệnh đề WHERE dưới đây. App đó đang
-- chạy production; kéo nhầm chúng sang đây là mất dữ liệu.

\set ON_ERROR_STOP on

BEGIN;

-- (workspaceId -> application nguồn, application đích)
DROP TABLE IF EXISTS reparent_target;
CREATE TEMP TABLE reparent_target AS
SELECT
  support."workspaceId" AS workspace_id,
  task."id"             AS from_application_id,
  support."id"          AS to_application_id
FROM core."application" support
JOIN core."application" task
  ON task."workspaceId" = support."workspaceId"
 AND task."universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'::uuid
 AND task."deletedAt" IS NULL
WHERE support."universalIdentifier" = '37713d9d-6058-4b15-bac2-6a8f2f234e5a'::uuid
  AND support."deletedAt" IS NULL;

DO $$
DECLARE
  workspace_count integer;
  target_count integer;
BEGIN
  SELECT count(*) INTO workspace_count FROM core."workspace" WHERE "deletedAt" IS NULL;
  SELECT count(*) INTO target_count FROM reparent_target;

  IF target_count <> workspace_count THEN
    RAISE EXCEPTION
      'Co % workspace nhung chi % workspace co ca hai application. Chay 01-create-application.sql truoc.',
      workspace_count, target_count;
  END IF;
END $$;

DROP TABLE IF EXISTS reparent_object;
CREATE TEMP TABLE reparent_object AS
SELECT om."id" AS object_metadata_id, t.workspace_id, t.from_application_id, t.to_application_id
FROM core."objectMetadata" om
JOIN reparent_target t ON t.workspace_id = om."workspaceId"
WHERE om."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'::uuid
  AND om."applicationId" = t.from_application_id;

-- 1. objectMetadata — bước quyết định.
UPDATE core."objectMetadata" om
SET "applicationId" = r.to_application_id
FROM reparent_object r
WHERE om."id" = r.object_metadata_id;

-- 2. fieldMetadata trên `merchant`, TRỪ `issues`. Quan hệ sang issue là của
--    task-manager và ở lại đó — một app sở hữu được field trên object của app
--    khác, đúng như merchant-email-campaigns đang làm với 6 field của nó.
UPDATE core."fieldMetadata" fm
SET "applicationId" = r.to_application_id
FROM reparent_object r
WHERE fm."objectMetadataId" = r.object_metadata_id
  AND fm."applicationId" = r.from_application_id
  AND fm."name" <> 'issues';

-- 3. `app.merchants` — vế còn lại của quan hệ merchant <-> app. Nó nằm trên
--    object `app` mà task-manager giữ, nên phải liệt kê riêng: để một quan hệ
--    bị hai app chia nhau sở hữu là tự chuốc lấy diff mâu thuẫn ở mỗi lần sync.
UPDATE core."fieldMetadata" fm
SET "applicationId" = t.to_application_id
FROM reparent_target t
WHERE fm."workspaceId" = t.workspace_id
  AND fm."universalIdentifier" = '47a89700-ba35-4c37-84da-afca9f43bd8c'::uuid
  AND fm."applicationId" = t.from_application_id;

-- 4. indexMetadata trên merchant. Index BẮT BUỘC đi cùng object: manifest khai
--    index mà không khai object thì `twenty plan` từ chối với
--    'Index ... references unknown object'. Đã gặp thật khi thử để index lại.
UPDATE core."indexMetadata" im
SET "applicationId" = r.to_application_id
FROM reparent_object r
WHERE im."objectMetadataId" = r.object_metadata_id
  AND im."applicationId" = r.from_application_id;

-- 5. searchFieldMetadata (cột searchVector của merchant).
UPDATE core."searchFieldMetadata" sfm
SET "applicationId" = r.to_application_id
FROM reparent_object r
WHERE sfm."objectMetadataId" = r.object_metadata_id
  AND sfm."applicationId" = r.from_application_id;

-- ĐỐI CHIẾU — đọc kỹ trước khi COMMIT, ROLLBACK nếu lệch.

-- 6 field của merchant-email-campaigns phải còn nguyên chủ cũ.
SELECT a."name" AS owner, count(*) AS field_count
FROM core."fieldMetadata" fm
JOIN core."objectMetadata" om ON om."id" = fm."objectMetadataId"
JOIN core."application" a ON a."id" = fm."applicationId"
WHERE om."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'::uuid
GROUP BY a."name"
ORDER BY a."name";
-- Kỳ vọng: Customer Support 11, Merchant Email Campaigns 6, Task Manager 1 (issues).

-- Số dòng dữ liệu không được đổi.
-- SELECT count(*) FROM "<workspace_schema>"."_merchant";

COMMIT;

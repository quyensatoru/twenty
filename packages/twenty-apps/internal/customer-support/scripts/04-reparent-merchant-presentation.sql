-- Bước 4 — đổi chủ view, viewField và navigationMenuItem của `merchant`.
--
--   node scripts/run-sql.mjs scripts/04-reparent-merchant-presentation.sql
--
-- ../task-manager/scripts/02-reparent-metadata.sql cố tình KHÔNG re-parent mấy
-- bảng này, vì ở lần cutover đó app khai lại chúng bằng universalIdentifier
-- MỚI, nên re-parent chỉ để `twenty apply` xoá đi ở bước sau.
--
-- Lần này khác: customer-support khai lại view `Merchants` và nav item của nó
-- bằng ĐÚNG UID cũ. Không re-parent thì `twenty plan` của task-manager sinh 4
-- lệnh destroy (view + 2 viewField + nav item) rồi customer-support tạo lại
-- y hệt — phải chạy `apply --force` và có một khoảng hai app cùng tranh một
-- UID. Re-parent thì cả bốn thành UPDATE tại chỗ và không app nào phải xoá gì.
--
-- Không có dữ liệu người dùng nào ở đây; đây thuần là phần trình bày.

\set ON_ERROR_STOP on

BEGIN;

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

-- viewField trước view: sau khi view đổi chủ thì mệnh đề lọc theo chủ cũ của
-- view không còn tìm thấy gì.
UPDATE core."viewField" vf
SET "applicationId" = t.to_application_id
FROM reparent_target t, core."view" v, core."objectMetadata" om
WHERE v."id" = vf."viewId"
  AND om."id" = v."objectMetadataId"
  AND om."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'::uuid
  AND vf."applicationId" = t.from_application_id;

UPDATE core."view" v
SET "applicationId" = t.to_application_id
FROM reparent_target t, core."objectMetadata" om
WHERE om."id" = v."objectMetadataId"
  AND om."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'::uuid
  AND v."applicationId" = t.from_application_id;

UPDATE core."navigationMenuItem" nmi
SET "applicationId" = t.to_application_id
FROM reparent_target t
WHERE nmi."universalIdentifier" = '7f0e425f-99ba-4782-ac92-23252d22cfdd'::uuid
  AND nmi."applicationId" = t.from_application_id;

-- ĐỐI CHIẾU — view trên merchant phải thuộc Customer Support cả.
SELECT a."name" AS owner, v."name" AS view_name
FROM core."view" v
JOIN core."objectMetadata" om ON om."id" = v."objectMetadataId"
JOIN core."application" a ON a."id" = v."applicationId"
WHERE om."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'::uuid
ORDER BY a."name", v."name";

COMMIT;

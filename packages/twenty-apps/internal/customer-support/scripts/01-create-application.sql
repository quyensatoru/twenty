-- Bước 1 — tạo dòng application cho Customer Support.
--
--   psql "$DATABASE_URL" -f 01-create-application.sql
--
-- Chạy trước 02-reparent-merchant.sql và trước khi deploy bản có app này.
-- Idempotent: chạy lại không tạo trùng.
--
-- universalIdentifier phải khớp TUYỆT ĐỐI với APPLICATION_UID trong
-- src/constants/universal-identifiers.ts. Sai một ký tự thì `twenty apply` coi
-- merchant là chưa tồn tại và tạo bảng rỗng song song.

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO core."application" (
  "universalIdentifier",
  "name",
  "description",
  "sourcePath",
  "workspaceId"
)
SELECT
  '37713d9d-6058-4b15-bac2-6a8f2f234e5a'::uuid,
  'Customer Support',
  'Merchant master data shared across apps',
  'packages/twenty-apps/internal/customer-support',
  w."id"
FROM core."workspace" w
WHERE w."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM core."application" a
    WHERE a."workspaceId" = w."id"
      AND a."universalIdentifier" = '37713d9d-6058-4b15-bac2-6a8f2f234e5a'::uuid
      AND a."deletedAt" IS NULL
  );

-- Phải ra đúng một dòng cho mỗi workspace còn sống.
SELECT a."workspaceId", a."id" AS application_id, a."name"
FROM core."application" a
WHERE a."universalIdentifier" = '37713d9d-6058-4b15-bac2-6a8f2f234e5a'::uuid
  AND a."deletedAt" IS NULL
ORDER BY a."workspaceId";

COMMIT;

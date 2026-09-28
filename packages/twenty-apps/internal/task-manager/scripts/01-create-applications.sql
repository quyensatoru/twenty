-- Bước 1 của CUTOVER.md — tạo dòng application cho task-manager.
--
--   psql "$DATABASE_URL" -f 01-create-applications.sql
--
-- Chạy trên server FORK, trước khi deploy nhánh apps/zero-core.
-- Idempotent: chạy lại không tạo trùng.
--
-- universalIdentifier phải khớp TUYỆT ĐỐI với APPLICATION_UID trong
-- src/constants/universal-identifiers.ts. Sai một ký tự thì `twenty apply` sẽ
-- coi mọi object là chưa tồn tại và tạo bảng rỗng song song.

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
  '819550d5-882b-4b96-8afd-b02e0d2b41c1'::uuid,
  'Task Manager',
  'Jira-style issue tracking scoped by Shopify app',
  'packages/twenty-apps/internal/task-manager',
  w."id"
FROM core."workspace" w
WHERE w."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM core."application" a
    WHERE a."workspaceId" = w."id"
      AND a."universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'::uuid
      AND a."deletedAt" IS NULL
  );

-- Phải ra đúng một dòng cho mỗi workspace còn sống.
SELECT
  a."workspaceId",
  a."id" AS application_id,
  a."name"
FROM core."application" a
WHERE a."universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'::uuid
  AND a."deletedAt" IS NULL
ORDER BY a."workspaceId";

COMMIT;

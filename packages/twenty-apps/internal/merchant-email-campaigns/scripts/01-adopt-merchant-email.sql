-- Trước lần `twenty apply` đầu tiên trên workspace đã có field `merchant.email`
-- do người dùng tạo (application "Custom"): giao field đó cho app này.
--
--   psql "$DATABASE_URL" --single-transaction -f 01-adopt-merchant-email.sql
--
-- App khai `merchant.email` kiểu EMAILS (src/fields/email-on-merchant.field.ts).
-- Nếu field cùng tên đã tồn tại dưới chủ khác, apply dừng với
-- `NOT_AVAILABLE: Name "email" is not available`. Field có sẵn cùng kiểu và
-- đang giữ email của merchant, nên nhận nó về (đổi applicationId và
-- universalIdentifier) thay vì tạo cột mới: dữ liệu giữ nguyên, apply ra UPDATE.
--
-- Idempotent. Không đụng field nếu kiểu khác EMAILS — khi đó dừng hẳn.

\set ON_ERROR_STOP on

INSERT INTO core."application" (
  "universalIdentifier", "name", "description", "sourcePath", "workspaceId"
)
SELECT
  'afd80b02-f218-41be-a9a1-3c62737f9411'::uuid,
  'Merchant Email Campaigns',
  'Email campaigns and automations sent to merchants',
  'packages/twenty-apps/internal/merchant-email-campaigns',
  w."id"
FROM core."workspace" w
WHERE w."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM core."application" a
    WHERE a."workspaceId" = w."id"
      AND a."universalIdentifier" = 'afd80b02-f218-41be-a9a1-3c62737f9411'::uuid
      AND a."deletedAt" IS NULL
  );

DO $$
DECLARE
  wrong_type integer;
BEGIN
  SELECT count(*) INTO wrong_type
  FROM core."fieldMetadata" f
  JOIN core."objectMetadata" o ON o.id = f."objectMetadataId"
  WHERE o."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'
    AND f.name = 'email'
    AND f.type <> 'EMAILS';

  IF wrong_type > 0 THEN
    RAISE EXCEPTION 'merchant.email ton tai nhung khong phai EMAILS, dung lai';
  END IF;
END $$;

UPDATE core."fieldMetadata" f
SET "applicationId" = mec.id,
    "universalIdentifier" = 'b6c7bf1f-f1c0-40a2-916d-2563550f9389'::uuid
FROM core."objectMetadata" o, core."application" mec
WHERE o.id = f."objectMetadataId"
  AND o."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'
  AND f.name = 'email'
  AND mec."workspaceId" = f."workspaceId"
  AND mec."universalIdentifier" = 'afd80b02-f218-41be-a9a1-3c62737f9411'
  AND mec."deletedAt" IS NULL
  AND f."applicationId" <> mec.id;

-- Phải ra một dòng mỗi workspace, owner = Merchant Email Campaigns.
SELECT f."workspaceId", f.name, f.type, a.name AS owner, f."universalIdentifier"
FROM core."fieldMetadata" f
JOIN core."objectMetadata" o ON o.id = f."objectMetadataId"
JOIN core."application" a ON a.id = f."applicationId"
WHERE o."universalIdentifier" = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca'
  AND f.name = 'email';

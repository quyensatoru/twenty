-- Bước 1 của CUTOVER.md: tạo dòng `application` cho Shift Management, vẫn trên
-- server fork.
--
--   psql "$DATABASE_URL" -v workspace_id=<uuid> -f scripts/01-create-applications.sql
--
-- Vì sao phải làm bằng SQL: `twenty apply` chưa chạy được ở giai đoạn này. Ba
-- object vẫn thuộc twenty-standard application, và unique index
-- IDX_3a00d35710f4227ded320fd96d trên ("workspaceId", "universalIdentifier") của
-- core."objectMetadata" sẽ chặn ngay khi sync cố tạo bản sao.
--
-- `universalIdentifier` phải khớp đúng APPLICATION_UID trong
-- src/constants/universal-identifiers.ts — nếu lệch, bước 2 re-parent sang một
-- application mà `twenty apply` sau này không nhận là của mình, và apply sẽ tạo
-- bảng rỗng song song.
--
-- ON CONFLICT DO NOTHING: chạy lại file này là vô hại.
--
-- CẢNH BÁO khi rollback: SyncableEntity.application khai báo onDelete: 'CASCADE'.
-- Xoá dòng application này trong khi metadata vẫn trỏ vào nó sẽ xoá luôn toàn bộ
-- objectMetadata / fieldMetadata / view của shift. Re-parent về standard trước,
-- xoá application sau cùng — xem mục Rollback trong MIGRATION.md.

INSERT INTO core."application" (
  "universalIdentifier",
  "name",
  "description",
  "version",
  "sourceType",
  "state",
  "sourcePath",
  "workspaceId"
)
VALUES (
  'f933e505-1fbd-425d-8906-5a9d2e3c73a8',
  'Shift Management',
  'Shift registration, check-in/check-out and the monthly attendance report for a 24/7 rota.',
  '0.1.0',
  'local',
  'INSTALLED',
  'packages/twenty-apps/internal/shift-management',
  :'workspace_id'
)
ON CONFLICT ("universalIdentifier", "workspaceId") DO NOTHING;

-- Phải trả về đúng 1 dòng trước khi đi tiếp.
SELECT id, "universalIdentifier", "name", "state", "workspaceId"
FROM core."application"
WHERE "universalIdentifier" = 'f933e505-1fbd-425d-8906-5a9d2e3c73a8'
  AND "workspaceId" = :'workspace_id';

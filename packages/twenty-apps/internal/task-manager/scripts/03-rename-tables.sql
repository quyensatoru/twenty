-- Bước 3 của CUTOVER.md — đổi tên bảng vật lý sang quy ước của app.
--
--   psql "$DATABASE_URL" -v schema=workspace_xxxxxxxx -f 03-rename-tables.sql
--
-- Chạy trên server FORK, sau 02-reparent-metadata.sql, trước khi deploy.
-- Chạy MỘT LẦN CHO MỖI workspace schema.
--
-- computeObjectTargetTable gọi computeTableName(nameSingular, isCustom) với
-- isCustom = applicationUniversalIdentifier <> standard, và computeTableName
-- thêm tiền tố '_'. Object vừa đổi chủ ở bước 2 nên từ giờ ORM đi tìm `_issue`
-- chứ không phải `issue`. ALTER TABLE ... RENAME giữ nguyên dữ liệu, index,
-- constraint, trigger và sequence.
--
-- Idempotent: mỗi lệnh bỏ qua nếu tên cũ không còn.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

BEGIN;

-- psql không thay biến :"schema" bên trong thân DO, nên gắn nó vào một GUC
-- phiên làm việc rồi đọc lại bằng current_setting.
SELECT set_config('task_manager.schema', :'schema', false);

DO $$
DECLARE
  target_schema text := current_setting('task_manager.schema');
  object_name text;
  renamed integer := 0;
BEGIN
  FOREACH object_name IN ARRAY ARRAY[
    'app',
    'appAccess',
    'merchant',
    'project',
    'sprint',
    'epic',
    'issueStatus',
    'issue',
    'issueMerchant',
    'issueComment',
    'worklog'
  ] LOOP
    -- Đã đổi rồi thì bỏ qua, chưa có bảng cũ cũng bỏ qua: cả hai đều là trạng
    -- thái hợp lệ khi chạy lại.
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = target_schema AND table_name = object_name
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = target_schema AND table_name = '_' || object_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.%I RENAME TO %I',
        target_schema, object_name, '_' || object_name
      );
      renamed := renamed + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Da doi ten % bang trong schema %', renamed, target_schema;
END $$;

-- ĐỐI CHIẾU — phải ra đúng 11 dòng, mọi tên đều bắt đầu bằng '_'.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = current_setting('task_manager.schema')
  AND table_name IN (
    '_app', '_appAccess', '_merchant', '_project', '_sprint', '_epic',
    '_issueStatus', '_issue', '_issueMerchant', '_issueComment', '_worklog'
  )
ORDER BY table_name;

-- Phải ra 0 dòng: không còn tên trần nào sót lại.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = current_setting('task_manager.schema')
  AND table_name IN (
    'app', 'appAccess', 'merchant', 'project', 'sprint', 'epic',
    'issueStatus', 'issue', 'issueMerchant', 'issueComment', 'worklog'
  )
ORDER BY table_name;

COMMIT;

-- Bước 3b — sao lưu các liên kết mà cutover KHÔNG giữ được.
--
--   psql "$DATABASE_URL" -v schema=workspace_xxxxxxxx -f 04-preserve-cross-object-links.sql
--
-- Chạy trên server FORK, sau 03-rename-tables.sql, TRƯỚC khi deploy.
-- Chạy một lần cho mỗi workspace schema. Không sửa gì, chỉ tạo bảng sao lưu.
--
-- Vì sao cần: fork thêm các nhánh morph trỏ vào object task-manager trên bốn
-- object của upstream — `attachment` (targetIssue, targetIssueComment,
-- targetProject, targetMerchant), `noteTarget` (targetMerchant), `taskTarget`
-- (targetMerchant), `timelineActivity` (targetIssue, targetEpic,
-- targetMerchant). Các field này thuộc standard application và KHÔNG có trong
-- manifest của upstream, nên standard sync sẽ xoá chúng ở Bước 4 và DROP các
-- cột tương ứng. App không khai lại được: SDK chưa cho app thêm nhánh vào một
-- field MORPH của standard object.
--
-- Hậu quả: dòng attachment / note / task / timeline activity VẪN CÒN, chỉ mất
-- liên kết tới issue, project, merchant, epic. File này giữ lại các cặp id đó
-- trong schema workspace để nối lại sau, nếu SDK hỗ trợ morph.
-- Xem MIGRATION.md mục 5.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

BEGIN;

SELECT set_config('task_manager.schema', :'schema', false);

DO $$
DECLARE
  target_schema text := current_setting('task_manager.schema');
  link record;
  saved integer;
BEGIN
  FOR link IN
    SELECT * FROM (VALUES
      ('attachment',       'targetIssueId'),
      ('attachment',       'targetIssueCommentId'),
      ('attachment',       'targetProjectId'),
      ('attachment',       'targetMerchantId'),
      ('noteTarget',       'targetMerchantId'),
      ('taskTarget',       'targetMerchantId'),
      ('timelineActivity', 'targetIssueId'),
      ('timelineActivity', 'targetEpicId'),
      ('timelineActivity', 'targetMerchantId')
    ) AS t(source_table, link_column)
  LOOP
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = target_schema
        AND table_name = link.source_table
        AND column_name = link.link_column
    );

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I.%I AS
         SELECT "id" AS source_id, %I AS target_id
         FROM %I.%I
         WHERE %I IS NOT NULL',
      target_schema,
      '_cutover_link_' || link.source_table || '_' || link.link_column,
      link.link_column,
      target_schema, link.source_table,
      link.link_column
    );

    EXECUTE format(
      'SELECT count(*) FROM %I.%I',
      target_schema,
      '_cutover_link_' || link.source_table || '_' || link.link_column
    ) INTO saved;

    RAISE NOTICE 'Da luu % lien ket %.%', saved, link.source_table, link.link_column;
  END LOOP;
END $$;

-- ĐỐI CHIẾU — số dòng đã giữ lại cho từng liên kết. Ghi lại con số này; sau
-- deploy các bảng _cutover_link_* phải còn nguyên (standard sync không đụng tới
-- bảng nó không biết).
SELECT table_name, (xpath('//row/c/text()',
  query_to_xml(format('SELECT count(*) AS c FROM %I.%I',
    current_setting('task_manager.schema'), table_name), false, false, '')
))[1]::text::bigint AS row_count
FROM information_schema.tables
WHERE table_schema = current_setting('task_manager.schema')
  AND table_name LIKE '\_cutover\_link\_%'
ORDER BY table_name;

COMMIT;

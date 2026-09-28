-- Bước 0 của CUTOVER.md — ghi lại số dòng TRƯỚC khi đụng vào bất cứ thứ gì.
--
--   psql "$DATABASE_URL" -v schema=workspace_xxxxxxxx -f 00-row-counts.sql
--
-- Chạy lại NGUYÊN VĂN file này sau Bước 4 và Bước 7; kết quả phải trùng từng
-- dòng. Lệch một dòng nghĩa là standard sync đã xoá mất dữ liệu.
--
-- File tự nhận ra bảng mang tên nào: trước cutover là `issue`, sau cutover là
-- `_issue`. Không phải sửa gì giữa các lần chạy — sửa tay một checklist đối
-- chiếu là cách nhanh nhất để nó nói dối.
--
-- Nhiều workspace thì chạy một lần cho mỗi schema và giữ riêng từng kết quả.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

SELECT set_config('task_manager.schema', :'schema', false);

-- Tên bảng thực tế của từng object, ở bất kỳ phía nào của cutover.
CREATE OR REPLACE FUNCTION pg_temp.task_manager_table(object_name text)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = current_setting('task_manager.schema')
    AND table_name IN (object_name, '_' || object_name)
  ORDER BY table_name
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION pg_temp.task_manager_count(object_name text)
RETURNS bigint LANGUAGE plpgsql STABLE AS $$
DECLARE
  resolved text := pg_temp.task_manager_table(object_name);
  result bigint;
BEGIN
  IF resolved IS NULL THEN
    RETURN NULL;
  END IF;

  EXECUTE format('SELECT count(*) FROM %I.%I',
    current_setting('task_manager.schema'), resolved) INTO result;

  RETURN result;
END $$;

-- Số dòng từng bảng. `table_name` cho thấy đang ở phía nào của cutover;
-- `row_count` phải giữ nguyên qua cả hai phía. NULL = không tìm thấy bảng nào,
-- dừng lại ngay.
SELECT
  object_name,
  pg_temp.task_manager_table(object_name) AS table_name,
  pg_temp.task_manager_count(object_name) AS row_count
FROM unnest(ARRAY[
  'app', 'appAccess', 'merchant', 'project', 'sprint', 'epic',
  'issueStatus', 'issue', 'issueMerchant', 'issueComment', 'worklog'
]) AS object_name
ORDER BY object_name;

-- Bất biến dữ liệu. Mọi dòng phải trả về 0, trước và sau như nhau.
CREATE OR REPLACE FUNCTION pg_temp.task_manager_scalar(statement text)
RETURNS bigint LANGUAGE plpgsql STABLE AS $$
DECLARE
  result bigint;
BEGIN
  EXECUTE statement INTO result;

  RETURN result;
END $$;

SELECT invariant, pg_temp.task_manager_scalar(statement) AS count
FROM (
  VALUES
    ('issue khong co project', format(
      'SELECT count(*) FROM %I.%I WHERE "projectId" IS NULL',
      current_setting('task_manager.schema'), pg_temp.task_manager_table('issue'))),
    ('project khong co app', format(
      'SELECT count(*) FROM %I.%I WHERE "appId" IS NULL',
      current_setting('task_manager.schema'), pg_temp.task_manager_table('project'))),
    ('merchant khong co app', format(
      'SELECT count(*) FROM %I.%I WHERE "appId" IS NULL',
      current_setting('task_manager.schema'), pg_temp.task_manager_table('merchant'))),
    ('issue trung issueKey', format(
      'SELECT count(*) FROM (SELECT "issueKey" FROM %I.%I
         WHERE "issueKey" IS NOT NULL AND "issueKey" <> '''' AND "deletedAt" IS NULL
         GROUP BY "issueKey" HAVING count(*) > 1) duplicated',
      current_setting('task_manager.schema'), pg_temp.task_manager_table('issue'))),
    ('issueMerchant trung cap', format(
      'SELECT count(*) FROM (SELECT "merchantId", "issueId" FROM %I.%I
         WHERE "deletedAt" IS NULL
         GROUP BY "merchantId", "issueId" HAVING count(*) > 1) duplicated_pairs',
      current_setting('task_manager.schema'), pg_temp.task_manager_table('issueMerchant')))
) AS checks(invariant, statement);

-- Bộ đếm issueKey của từng project so với số lớn nhất đã phát ra. Sau cutover
-- route create-issue đọc chính cột này; nếu nó thấp hơn số đã dùng thì issue
-- mới sẽ va unique index và tiêu hết 5 lần retry. Ra rỗng là đạt; ra dòng nào
-- thì sửa theo MIGRATION.md mục 7 TRƯỚC khi deploy.
--
-- So tiền tố bằng left(), không bằng regex: key dự án là dữ liệu người dùng
-- nhập, đưa thẳng vào regex là sai ngay khi nó chứa ký tự đặc biệt.
SELECT * FROM xmltable(
  '//row'
  PASSING query_to_xml(format($fmt$
    SELECT
      p."id"::text AS project_id,
      p."key" AS project_key,
      coalesce(p."nextIssueNumber", 0) AS next_issue_number,
      coalesce(max(substring(i."issueKey" from '[0-9]+$')::bigint), 0) AS max_used
    FROM %I.%I p
    LEFT JOIN %I.%I i
      ON i."projectId" = p."id"
     AND p."key" IS NOT NULL
     AND left(i."issueKey", length(p."key") + 1) = p."key" || '-'
     AND substring(i."issueKey" from '[0-9]+$') IS NOT NULL
    GROUP BY p."id", p."key", p."nextIssueNumber"
    HAVING coalesce(p."nextIssueNumber", 0)
         < coalesce(max(substring(i."issueKey" from '[0-9]+$')::bigint), 0)
  $fmt$,
    current_setting('task_manager.schema'), pg_temp.task_manager_table('project'),
    current_setting('task_manager.schema'), pg_temp.task_manager_table('issue')
  -- tableforest = false: một forest rỗng không phải XML document hợp lệ, nên
  -- xmltable chết đúng vào trường hợp đáng mừng nhất — không project nào lệch.
  -- Bọc trong <table> thì kết quả rỗng vẫn parse được.
  ), false, false, '')
  COLUMNS
    project_key text,
    next_issue_number bigint,
    max_used bigint,
    project_id text
) ORDER BY project_key;

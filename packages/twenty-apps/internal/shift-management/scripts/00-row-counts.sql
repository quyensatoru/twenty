-- Bước 0 của CUTOVER.md: ghi lại số dòng TRƯỚC khi đụng vào bất cứ thứ gì.
-- Chạy lại đúng file này sau bước 4 (deploy) và sau bước 5 (apply) — ba lần phải
-- ra cùng một con số. Lệch một dòng nghĩa là có thứ gì đó đã bị xoá.
--
--   psql "$DATABASE_URL" -v schema=workspace_xxxxxxxx -f scripts/00-row-counts.sql
--
-- Trước khi đổi tên bảng (bước 3), ba bảng còn tên standard: shift, shiftTemplate,
-- specialDay. Sau đó là _shift, _shiftTemplate, _specialDay — dùng phần dưới.

\echo '--- Trước khi đổi tên bảng ---'
SELECT 'shift' AS "table", count(*) FROM :"schema"."shift"
UNION ALL SELECT 'shiftTemplate', count(*) FROM :"schema"."shiftTemplate"
UNION ALL SELECT 'specialDay', count(*) FROM :"schema"."specialDay"
ORDER BY 1;

-- Phân bố theo trạng thái: một con số tổng bằng nhau vẫn có thể che mất việc dữ
-- liệu bị ghi đè, nên đối chiếu thêm mức này.
SELECT status, count(*) FROM :"schema"."shift" GROUP BY status ORDER BY status;

-- Mốc thời gian của dữ liệu chấm công — phải giữ nguyên qua toàn bộ cutover.
SELECT min(date) AS first_date,
       max(date) AS last_date,
       count(*) FILTER (WHERE "checkInAt" IS NOT NULL) AS checked_in,
       count(*) FILTER (WHERE "checkOutAt" IS NOT NULL) AS checked_out,
       coalesce(sum("workingMinutes"), 0) AS total_working_minutes
FROM :"schema"."shift";

-- Số dòng metadata sắp được re-parent. Ghi lại để bước 2 đối chiếu.
\echo '--- Metadata (schema core) ---'
SELECT 'objectMetadata' AS "table", count(*)
FROM core."objectMetadata"
WHERE "universalIdentifier" IN (
  '476bd249-6ab7-472f-82e0-3e538b41722d',  -- shift
  '930c8d12-0e7e-427c-87ec-5b155483b5d4',  -- shiftTemplate
  '25080a86-ab21-450f-b33b-b8be58f36a59'   -- specialDay
)
UNION ALL
SELECT 'fieldMetadata', count(*)
FROM core."fieldMetadata"
WHERE "objectMetadataId" IN (
  SELECT id FROM core."objectMetadata"
  WHERE "universalIdentifier" IN (
    '476bd249-6ab7-472f-82e0-3e538b41722d',
    '930c8d12-0e7e-427c-87ec-5b155483b5d4',
    '25080a86-ab21-450f-b33b-b8be58f36a59'
  )
)
   OR "universalIdentifier" = '217853a5-299d-4b07-8b6b-cf1e8c3bc14b'  -- workspaceMember.shifts
ORDER BY 1;

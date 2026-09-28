-- Bước 3 của CUTOVER.md: đổi tên bảng vật lý.
--
--   psql "$DATABASE_URL" -v schema=workspace_xxxxxxxx --single-transaction \
--        -f scripts/03-rename-tables.sql
--
-- Vì sao: computeObjectTargetTable gọi computeTableName(nameSingular, isCustom)
-- với isCustom = (applicationUniversalIdentifier !== TWENTY_STANDARD_APPLICATION),
-- và computeTableName thêm tiền tố '_'. Sau bước 2 ba object đã thuộc app, nên
-- ORM sẽ đi tìm _shift / _shiftTemplate / _specialDay.
--
-- ALTER TABLE ... RENAME giữ nguyên dữ liệu, index, constraint, khoá ngoại và
-- trigger. Tên index không đổi theo và cũng không cần đổi — ORM không dựng query
-- dựa vào tên index.
--
-- Chạy SAU bước 2 và TRƯỚC bước 4 (deploy). Giữa hai bước này server fork đang
-- chạy sẽ không tìm thấy bảng — đó là lý do toàn bộ cutover nằm trong một cửa sổ
-- bảo trì và truy cập người dùng đã bị chặn.

ALTER TABLE :"schema"."shift" RENAME TO "_shift";
ALTER TABLE :"schema"."shiftTemplate" RENAME TO "_shiftTemplate";
ALTER TABLE :"schema"."specialDay" RENAME TO "_specialDay";

-- Đối chiếu: ba bảng mới phải tồn tại, ba tên cũ phải biến mất, số dòng khớp
-- bước 0.
SELECT tablename
FROM pg_tables
WHERE schemaname = :'schema'
  AND tablename IN (
    'shift', 'shiftTemplate', 'specialDay',
    '_shift', '_shiftTemplate', '_specialDay'
  )
ORDER BY tablename;

SELECT '_shift' AS "table", count(*) FROM :"schema"."_shift"
UNION ALL SELECT '_shiftTemplate', count(*) FROM :"schema"."_shiftTemplate"
UNION ALL SELECT '_specialDay', count(*) FROM :"schema"."_specialDay"
ORDER BY 1;

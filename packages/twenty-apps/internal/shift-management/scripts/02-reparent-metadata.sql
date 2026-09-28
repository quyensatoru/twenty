-- Bước 2 của CUTOVER.md: đổi chủ sở hữu mọi metadata row của shift sang
-- application vừa tạo ở bước 1.
--
--   psql "$DATABASE_URL" -v workspace_id=<uuid> --single-transaction \
--        -f scripts/02-reparent-metadata.sql
--
-- Chạy trong MỘT transaction (--single-transaction): re-parent nửa chừng để lại
-- object thuộc app nhưng field vẫn thuộc standard, và standard sync ở bước 4 sẽ
-- xoá đúng những field còn sót đó.
--
-- Lọc theo "universalIdentifier", không theo tên: tên đổi được, universalIdentifier
-- thì không.
--
-- CUTOVER.md liệt kê 17 bảng core "có cột applicationId". Với shift chỉ 8 bảng dưới
-- đây thực sự có cột đó và có dòng cần chuyển. Các bảng còn lại trong danh sách
-- (viewFilter, viewFilterGroup, viewSort, objectPermission, fieldPermission,
-- indexFieldMetadata) KHÔNG có cột applicationId — chúng treo vào view / role /
-- index và đi theo cha, không cần đụng tới.
--
-- pageLayout / pageLayoutTab / pageLayoutWidget cũng không có ở đây: bản fork vẽ
-- 4 trang shift bằng React route hardcode, không có page layout nào trong DB.
-- `twenty apply` sẽ tạo mới chúng.

\set shift_uid '476bd249-6ab7-472f-82e0-3e538b41722d'
\set shift_template_uid '930c8d12-0e7e-427c-87ec-5b155483b5d4'
\set special_day_uid '25080a86-ab21-450f-b33b-b8be58f36a59'
-- Field `shifts` app này thêm lên standard object workspaceMember. Nó KHÔNG nằm
-- trong bộ lọc theo objectMetadataId bên dưới (objectMetadataId của nó là
-- workspaceMember), nên phải gọi tên riêng.
\set shifts_on_member_uid '217853a5-299d-4b07-8b6b-cf1e8c3bc14b'

CREATE TEMP TABLE shift_application AS
SELECT id
FROM core."application"
WHERE "universalIdentifier" = 'f933e505-1fbd-425d-8906-5a9d2e3c73a8'
  AND "workspaceId" = :'workspace_id';

-- Dừng ngay nếu bước 1 chưa chạy: không có application thì mọi UPDATE dưới đây
-- sẽ ghi NULL và phá metadata.
DO $$
BEGIN
  IF (SELECT count(*) FROM shift_application) <> 1 THEN
    RAISE EXCEPTION 'Chua co dong application cho Shift Management — chay 01-create-applications.sql truoc';
  END IF;
END $$;

CREATE TEMP TABLE shift_objects AS
SELECT id
FROM core."objectMetadata"
WHERE "workspaceId" = :'workspace_id'
  AND "universalIdentifier" IN (
    :'shift_uid', :'shift_template_uid', :'special_day_uid'
  );

CREATE TEMP TABLE shift_views AS
SELECT id
FROM core."view"
WHERE "workspaceId" = :'workspace_id'
  AND "objectMetadataId" IN (SELECT id FROM shift_objects);

-- 1/8 objectMetadata
UPDATE core."objectMetadata"
SET "applicationId" = (SELECT id FROM shift_application)
WHERE id IN (SELECT id FROM shift_objects);

-- 2/8 fieldMetadata — mọi field của ba object, cộng field `shifts` trên
-- workspaceMember. Bao gồm cả các field hệ thống (id, createdAt, position,
-- searchVector…) vì chúng cũng mang objectMetadataId của ba object.
UPDATE core."fieldMetadata"
SET "applicationId" = (SELECT id FROM shift_application)
WHERE "workspaceId" = :'workspace_id'
  AND (
    "objectMetadataId" IN (SELECT id FROM shift_objects)
    OR "universalIdentifier" = :'shifts_on_member_uid'
  );

-- 3/8 indexMetadata
UPDATE core."indexMetadata"
SET "applicationId" = (SELECT id FROM shift_application)
WHERE "workspaceId" = :'workspace_id'
  AND "objectMetadataId" IN (SELECT id FROM shift_objects);

-- 4/8 searchFieldMetadata — ba object đều isSearchable, nên đều có dòng ở đây.
UPDATE core."searchFieldMetadata"
SET "applicationId" = (SELECT id FROM shift_application)
WHERE "workspaceId" = :'workspace_id'
  AND "objectMetadataId" IN (SELECT id FROM shift_objects);

-- 5/8 view — ba INDEX view allShifts / allShiftTemplates / allSpecialDays.
UPDATE core."view"
SET "applicationId" = (SELECT id FROM shift_application)
WHERE id IN (SELECT id FROM shift_views);

-- 6/8 viewField
UPDATE core."viewField"
SET "applicationId" = (SELECT id FROM shift_application)
WHERE "workspaceId" = :'workspace_id'
  AND "viewId" IN (SELECT id FROM shift_views);

-- 7/8 viewFieldGroup
UPDATE core."viewFieldGroup"
SET "applicationId" = (SELECT id FROM shift_application)
WHERE "workspaceId" = :'workspace_id'
  AND "viewId" IN (SELECT id FROM shift_views);

-- 8/8 viewGroup
UPDATE core."viewGroup"
SET "applicationId" = (SELECT id FROM shift_application)
WHERE "workspaceId" = :'workspace_id'
  AND "viewId" IN (SELECT id FROM shift_views);

-- navigationMenuItem CỐ Ý không đổi chủ: các mục sidebar của bản fork thuộc
-- twenty-standard application và không còn trong manifest của nó, nên standard
-- sync ở bước 4 sẽ xoá chúng. Đó là kết quả mong muốn — app khai báo bộ nav item
-- riêng (universalIdentifier mới) và `twenty apply` tạo lại. Xoá một
-- navigationMenuItem không đụng gì tới `view` nó trỏ vào.

-- Đối chiếu: mọi con số phải khác 0 và khớp với bước 0.
\echo '--- Sau re-parent ---'
SELECT 'objectMetadata' AS "table", count(*) FROM core."objectMetadata"
  WHERE "applicationId" = (SELECT id FROM shift_application)
UNION ALL SELECT 'fieldMetadata', count(*) FROM core."fieldMetadata"
  WHERE "applicationId" = (SELECT id FROM shift_application)
UNION ALL SELECT 'indexMetadata', count(*) FROM core."indexMetadata"
  WHERE "applicationId" = (SELECT id FROM shift_application)
UNION ALL SELECT 'searchFieldMetadata', count(*) FROM core."searchFieldMetadata"
  WHERE "applicationId" = (SELECT id FROM shift_application)
UNION ALL SELECT 'view', count(*) FROM core."view"
  WHERE "applicationId" = (SELECT id FROM shift_application)
UNION ALL SELECT 'viewField', count(*) FROM core."viewField"
  WHERE "applicationId" = (SELECT id FROM shift_application)
UNION ALL SELECT 'viewFieldGroup', count(*) FROM core."viewFieldGroup"
  WHERE "applicationId" = (SELECT id FROM shift_application)
UNION ALL SELECT 'viewGroup', count(*) FROM core."viewGroup"
  WHERE "applicationId" = (SELECT id FROM shift_application)
ORDER BY 1;

-- Không được còn dòng nào của ba object thuộc application khác.
\echo '--- Sot lai (phai rong) ---'
SELECT om."universalIdentifier", fm."name", fm."applicationId"
FROM core."fieldMetadata" fm
JOIN core."objectMetadata" om ON om.id = fm."objectMetadataId"
WHERE fm."objectMetadataId" IN (SELECT id FROM shift_objects)
  AND fm."applicationId" IS DISTINCT FROM (SELECT id FROM shift_application);

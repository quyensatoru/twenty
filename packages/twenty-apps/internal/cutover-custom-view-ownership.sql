-- Giữ view người dùng tự tạo (Kanban, bộ lọc merchant...) ở application
-- "Custom" của workspace qua cutover.
--
--   psql "$DATABASE_URL" -v mode=snapshot -f cutover-custom-view-ownership.sql   -- trước mọi script re-parent
--   psql "$DATABASE_URL" -v mode=restore  -f cutover-custom-view-ownership.sql   -- sau khi re-parent xong (kể cả customer-support 02/04)
--
-- Các script 02 dời MỌI view của object được chuyển sang app, kể cả view thuộc
-- "Custom". Source app không khai các view đó nên `twenty apply` coi chúng là
-- thừa và xoá — mất toàn bộ view người dùng dựng trên fork. Trả chúng về Custom
-- thì apply không đụng tới, giống như view người dùng tạo trên một object của
-- app sau cutover.

\set ON_ERROR_STOP on

\if :{?mode}
\else
  \echo 'Thieu -v mode=snapshot|restore'
  \quit
\endif

SELECT :'mode' = 'snapshot' AS is_snapshot \gset

\if :is_snapshot
BEGIN;

CREATE TABLE IF NOT EXISTS core."_cutoverCustomViewOwnership" (
  "tableName" text NOT NULL,
  "id" uuid NOT NULL,
  "applicationId" uuid NOT NULL,
  PRIMARY KEY ("tableName", "id")
);

INSERT INTO core."_cutoverCustomViewOwnership"
SELECT 'view', v.id, v."applicationId" FROM core.view v
JOIN core.application a ON a.id = v."applicationId" AND a."sourcePath" = 'workspace-custom'
UNION ALL
SELECT 'viewField', c.id, c."applicationId" FROM core."viewField" c
JOIN core.application a ON a.id = c."applicationId" AND a."sourcePath" = 'workspace-custom'
UNION ALL
SELECT 'viewFieldGroup', c.id, c."applicationId" FROM core."viewFieldGroup" c
JOIN core.application a ON a.id = c."applicationId" AND a."sourcePath" = 'workspace-custom'
UNION ALL
SELECT 'viewFilter', c.id, c."applicationId" FROM core."viewFilter" c
JOIN core.application a ON a.id = c."applicationId" AND a."sourcePath" = 'workspace-custom'
UNION ALL
SELECT 'viewFilterGroup', c.id, c."applicationId" FROM core."viewFilterGroup" c
JOIN core.application a ON a.id = c."applicationId" AND a."sourcePath" = 'workspace-custom'
UNION ALL
SELECT 'viewGroup', c.id, c."applicationId" FROM core."viewGroup" c
JOIN core.application a ON a.id = c."applicationId" AND a."sourcePath" = 'workspace-custom'
UNION ALL
SELECT 'viewSort', c.id, c."applicationId" FROM core."viewSort" c
JOIN core.application a ON a.id = c."applicationId" AND a."sourcePath" = 'workspace-custom'
ON CONFLICT DO NOTHING;

SELECT "tableName", count(*) FROM core."_cutoverCustomViewOwnership" GROUP BY 1 ORDER BY 1;

COMMIT;
\else
BEGIN;

UPDATE core.view t SET "applicationId" = s."applicationId"
FROM core."_cutoverCustomViewOwnership" s
WHERE s."tableName" = 'view' AND s.id = t.id AND t."applicationId" <> s."applicationId";

UPDATE core."viewField" t SET "applicationId" = s."applicationId"
FROM core."_cutoverCustomViewOwnership" s
WHERE s."tableName" = 'viewField' AND s.id = t.id AND t."applicationId" <> s."applicationId";

UPDATE core."viewFieldGroup" t SET "applicationId" = s."applicationId"
FROM core."_cutoverCustomViewOwnership" s
WHERE s."tableName" = 'viewFieldGroup' AND s.id = t.id AND t."applicationId" <> s."applicationId";

UPDATE core."viewFilter" t SET "applicationId" = s."applicationId"
FROM core."_cutoverCustomViewOwnership" s
WHERE s."tableName" = 'viewFilter' AND s.id = t.id AND t."applicationId" <> s."applicationId";

UPDATE core."viewFilterGroup" t SET "applicationId" = s."applicationId"
FROM core."_cutoverCustomViewOwnership" s
WHERE s."tableName" = 'viewFilterGroup' AND s.id = t.id AND t."applicationId" <> s."applicationId";

UPDATE core."viewGroup" t SET "applicationId" = s."applicationId"
FROM core."_cutoverCustomViewOwnership" s
WHERE s."tableName" = 'viewGroup' AND s.id = t.id AND t."applicationId" <> s."applicationId";

UPDATE core."viewSort" t SET "applicationId" = s."applicationId"
FROM core."_cutoverCustomViewOwnership" s
WHERE s."tableName" = 'viewSort' AND s.id = t.id AND t."applicationId" <> s."applicationId";

-- Phải ra rỗng: không dòng nào trong snapshot còn thuộc chủ khác.
SELECT s."tableName", count(*) AS still_moved
FROM core."_cutoverCustomViewOwnership" s
LEFT JOIN core.view v ON s."tableName" = 'view' AND v.id = s.id
LEFT JOIN core."viewField" vf ON s."tableName" = 'viewField' AND vf.id = s.id
LEFT JOIN core."viewFilter" vfl ON s."tableName" = 'viewFilter' AND vfl.id = s.id
LEFT JOIN core."viewSort" vs ON s."tableName" = 'viewSort' AND vs.id = s.id
LEFT JOIN core."viewGroup" vg ON s."tableName" = 'viewGroup' AND vg.id = s.id
WHERE coalesce(v."applicationId", vf."applicationId", vfl."applicationId", vs."applicationId", vg."applicationId") <> s."applicationId"
GROUP BY 1;

COMMIT;
\endif

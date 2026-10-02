-- Sau 03-rename-tables.sql, trước `twenty apply`: bỏ bản sao trong thùng rác
-- của các cặp (merchant, issue) đang còn liên kết.
--
--   psql "$DATABASE_URL" --single-transaction -v schema=workspace_xxxxxxxx -f 03b-dedupe-soft-deleted-issue-merchants.sql
--
-- Unique index của fork trên ("merchantId", "issueId") có WHERE "deletedAt" IS
-- NULL; index app khai không mang được điều kiện đó (engine đặt
-- indexWhereClause = null cho index của app), nên apply không dựng được index
-- khi một cặp vừa có dòng sống vừa có dòng đã xoá mềm. App tự khôi phục dòng đã
-- xoá thay vì tạo mới khi gắn lại merchant, nên sau cutover không phát sinh lại.
--
-- Chỉ xoá dòng đã xoá mềm khi cặp đó còn đúng một dòng sống; dòng bị xoá được
-- chép nguyên vào "_cutover_removed_issueMerchant" trong cùng schema.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

CREATE TABLE IF NOT EXISTS :"schema"."_cutover_removed_issueMerchant"
  (LIKE :"schema"."_issueMerchant");

-- Mỗi cặp giữ một dòng: dòng sống nếu có, không thì dòng xoá mềm mới nhất.
-- Chỉ dòng đã xoá mềm mới bị bỏ; hai dòng cùng sống thì để nguyên cho index báo.
CREATE TEMP TABLE redundant_issue_merchant AS
SELECT ranked.id
FROM (
  SELECT im.id, im."deletedAt",
         row_number() OVER (
           PARTITION BY im."merchantId", im."issueId"
           ORDER BY (im."deletedAt" IS NULL) DESC, im."deletedAt" DESC, im."createdAt" DESC
         ) AS keep_rank
  FROM :"schema"."_issueMerchant" im
  WHERE im."merchantId" IS NOT NULL AND im."issueId" IS NOT NULL
) ranked
WHERE ranked.keep_rank > 1
  AND ranked."deletedAt" IS NOT NULL;

INSERT INTO :"schema"."_cutover_removed_issueMerchant"
SELECT im.* FROM :"schema"."_issueMerchant" im
WHERE im.id IN (SELECT id FROM redundant_issue_merchant)
  AND NOT EXISTS (
    SELECT 1 FROM :"schema"."_cutover_removed_issueMerchant" removed WHERE removed.id = im.id
  );

DELETE FROM :"schema"."_issueMerchant"
WHERE id IN (SELECT id FROM redundant_issue_merchant);

-- Phải ra 0: không còn cặp nào trùng, kể cả dòng đã xoá mềm. Cặp có cột NULL
-- không tính vì unique index coi NULL là khác nhau.
SELECT count(*) AS duplicated_pairs
FROM (
  SELECT 1 FROM :"schema"."_issueMerchant"
  WHERE "merchantId" IS NOT NULL AND "issueId" IS NOT NULL
  GROUP BY "merchantId", "issueId" HAVING count(*) > 1
) duplicated;

SELECT count(*) AS backed_up FROM :"schema"."_cutover_removed_issueMerchant";

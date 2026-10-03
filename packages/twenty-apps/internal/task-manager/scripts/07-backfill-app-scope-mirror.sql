-- Sau `twenty apply` của task-manager (và sau 06): điền cột `appId` mà
-- row-level predicate của role Task Manager member đọc. Chưa điền thì member
-- thường không thấy issue nào.
--
--   psql "$DATABASE_URL" --single-transaction -v schema=workspace_xxxxxxxx -f 07-backfill-app-scope-mirror.sql
--
-- Đúng quy tắc của route sync-app-scope-mirror (MIRROR_STEPS): issue, sprint,
-- epic, issueStatus lấy app của project; comment, worklog, history lấy app của
-- issue; issueMerchant lấy app của merchant; cha không có thì NULL. Route đó
-- không dùng được cho lần đầu trên production: nó đọc mọi merchant một lượt
-- (dừng ở 20000 dòng, prod có hơn 38000) và ghi từng dòng qua API (chạm giới
-- hạn 500 request/phút của application). Phần scopedAppIds của member vẫn
-- chạy bằng route với `{"only":"members"}`.
--
-- Idempotent: chỉ ghi dòng đang lệch.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

UPDATE :"schema"."_issue" child SET "appId" = project."appId"
FROM :"schema"."_issue" self
LEFT JOIN :"schema"."_project" project ON project.id = self."projectId"
WHERE child.id = self.id AND child."appId" IS DISTINCT FROM project."appId";

UPDATE :"schema"."_sprint" child SET "appId" = project."appId"
FROM :"schema"."_sprint" self
LEFT JOIN :"schema"."_project" project ON project.id = self."projectId"
WHERE child.id = self.id AND child."appId" IS DISTINCT FROM project."appId";

UPDATE :"schema"."_epic" child SET "appId" = project."appId"
FROM :"schema"."_epic" self
LEFT JOIN :"schema"."_project" project ON project.id = self."projectId"
WHERE child.id = self.id AND child."appId" IS DISTINCT FROM project."appId";

UPDATE :"schema"."_issueStatus" child SET "appId" = project."appId"
FROM :"schema"."_issueStatus" self
LEFT JOIN :"schema"."_project" project ON project.id = self."projectId"
WHERE child.id = self.id AND child."appId" IS DISTINCT FROM project."appId";

UPDATE :"schema"."_issueComment" child SET "appId" = issue."appId"
FROM :"schema"."_issueComment" self
LEFT JOIN :"schema"."_issue" issue ON issue.id = self."issueId"
WHERE child.id = self.id AND child."appId" IS DISTINCT FROM issue."appId";

UPDATE :"schema"."_worklog" child SET "appId" = issue."appId"
FROM :"schema"."_worklog" self
LEFT JOIN :"schema"."_issue" issue ON issue.id = self."issueId"
WHERE child.id = self.id AND child."appId" IS DISTINCT FROM issue."appId";

UPDATE :"schema"."_issueHistory" child SET "appId" = issue."appId"
FROM :"schema"."_issueHistory" self
LEFT JOIN :"schema"."_issue" issue ON issue.id = self."issueId"
WHERE child.id = self.id AND child."appId" IS DISTINCT FROM issue."appId";

UPDATE :"schema"."_issueMerchant" child SET "appId" = merchant."appId"
FROM :"schema"."_issueMerchant" self
LEFT JOIN :"schema"."_merchant" merchant ON merchant.id = self."merchantId"
WHERE child.id = self.id AND child."appId" IS DISTINCT FROM merchant."appId";

SELECT 'issue' AS object, count(*) AS rows, count("appId") AS with_app FROM :"schema"."_issue"
UNION ALL SELECT 'issueComment', count(*), count("appId") FROM :"schema"."_issueComment"
UNION ALL SELECT 'issueHistory', count(*), count("appId") FROM :"schema"."_issueHistory"
UNION ALL SELECT 'worklog', count(*), count("appId") FROM :"schema"."_worklog"
UNION ALL SELECT 'issueMerchant', count(*), count("appId") FROM :"schema"."_issueMerchant";

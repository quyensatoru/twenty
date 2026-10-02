-- Sau `twenty apply` của task-manager: đưa file đính kèm của fork vào field
-- FILES `issue.attachments` để chúng hiện lại trên issue.
--
--   psql "$DATABASE_URL" --single-transaction -v schema=workspace_xxxxxxxx -f 05-restore-issue-attachments.sql
--
-- Nguồn là `_cutover_link_attachment_targetIssueId` và
-- `_cutover_link_attachment_targetIssueCommentId` (do 04 tạo), không phải cột
-- target*Id của `attachment`, vì cột đó không còn metadata sau cutover. File
-- của comment gom về issue cha: composer của app cũng lưu upload của comment
-- vào chính field này.
--
-- Không chép file trong storage: `attachment.file` của fork cũng là field
-- FILES cùng định dạng `[{fileId, label, extension}]`, và URL được ký theo
-- fileId nên thư mục gốc của file không ảnh hưởng.
--
-- Idempotent: gộp với giá trị đang có, bỏ trùng theo fileId, giữ file của fork
-- (cũ hơn) lên trước theo thứ tự tạo.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

SELECT set_config('task_manager.schema', :'schema', false);

DO $$
DECLARE
  target_schema text := current_setting('task_manager.schema');
  updated integer;
BEGIN
  EXECUTE format($sql$
    WITH fork_file AS (
      SELECT link.target_id AS issue_id, a."createdAt", a.id AS attachment_id, file.value AS item, file.ordinality
      FROM %1$I."_cutover_link_attachment_targetIssueId" link
      JOIN %1$I.attachment a ON a.id = link.source_id AND a."deletedAt" IS NULL
      CROSS JOIN LATERAL jsonb_array_elements(coalesce(a.file, '[]'::jsonb)) WITH ORDINALITY AS file(value, ordinality)
      UNION ALL
      SELECT comment."issueId", a."createdAt", a.id, file.value, file.ordinality
      FROM %1$I."_cutover_link_attachment_targetIssueCommentId" link
      JOIN %1$I."_issueComment" comment ON comment.id = link.target_id
      JOIN %1$I.attachment a ON a.id = link.source_id AND a."deletedAt" IS NULL
      CROSS JOIN LATERAL jsonb_array_elements(coalesce(a.file, '[]'::jsonb)) WITH ORDINALITY AS file(value, ordinality)
    ),
    current_file AS (
      SELECT issue.id AS issue_id, 'infinity'::timestamptz AS "createdAt", NULL::uuid AS attachment_id, file.value AS item, file.ordinality
      FROM %1$I._issue issue
      CROSS JOIN LATERAL jsonb_array_elements(coalesce(issue.attachments, '[]'::jsonb)) WITH ORDINALITY AS file(value, ordinality)
      WHERE issue.id IN (SELECT issue_id FROM fork_file)
    ),
    ranked AS (
      SELECT *, row_number() OVER (
        PARTITION BY issue_id, item->>'fileId'
        ORDER BY "createdAt", attachment_id NULLS LAST, ordinality
      ) AS occurrence
      FROM (SELECT * FROM fork_file UNION ALL SELECT * FROM current_file) every_file
      WHERE item->>'fileId' IS NOT NULL
    ),
    merged AS (
      SELECT issue_id, jsonb_agg(item ORDER BY "createdAt", attachment_id NULLS LAST, ordinality) AS files
      FROM ranked
      WHERE occurrence = 1
      GROUP BY issue_id
    )
    UPDATE %1$I._issue issue
    SET attachments = merged.files
    FROM merged
    WHERE issue.id = merged.issue_id
      AND issue.attachments IS DISTINCT FROM merged.files
  $sql$, target_schema);

  GET DIAGNOSTICS updated = ROW_COUNT;
  RAISE NOTICE 'Da cap nhat attachments cho % issue', updated;
END $$;

-- Đối chiếu: mỗi file còn sống của fork phải có mặt trên issue tương ứng.
-- Phải ra 0.
SELECT count(*) AS fork_files_missing
FROM (
  SELECT link.target_id AS issue_id, file.value->>'fileId' AS file_id
  FROM :"schema"."_cutover_link_attachment_targetIssueId" link
  JOIN :"schema".attachment a ON a.id = link.source_id AND a."deletedAt" IS NULL
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(a.file, '[]'::jsonb)) AS file(value)
  UNION
  SELECT comment."issueId", file.value->>'fileId'
  FROM :"schema"."_cutover_link_attachment_targetIssueCommentId" link
  JOIN :"schema"."_issueComment" comment ON comment.id = link.target_id
  JOIN :"schema".attachment a ON a.id = link.source_id AND a."deletedAt" IS NULL
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(a.file, '[]'::jsonb)) AS file(value)
) expected
WHERE NOT EXISTS (
  SELECT 1
  FROM :"schema"._issue issue
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(issue.attachments, '[]'::jsonb)) AS file(value)
  WHERE issue.id = expected.issue_id
    AND file.value->>'fileId' = expected.file_id
);

-- Không issue nào vượt giới hạn của field. Phải ra 0.
SELECT count(*) AS issues_over_field_limit
FROM :"schema"._issue issue
JOIN core."fieldMetadata" field
  ON field."universalIdentifier" = '43fa7568-bd3f-4434-9fee-6c6bf75dc489'
WHERE jsonb_array_length(coalesce(issue.attachments, '[]'::jsonb))
    > (field.settings->>'maxNumberOfValues')::int;

-- Bước 2.6 (thay cho khối DELETE theo regex trong CUTOVER.md Bước 3b): gỡ mọi
-- field quan hệ của twenty-standard đang trỏ vào object đã đổi chủ sang app.
--
--   psql "$DATABASE_URL" --single-transaction -v schema=workspace_xxxxxxxx -f cutover-drop-orphan-standard-relations.sql
--
-- Regex cũ chỉ bắt target(Issue|Project|Merchant|Epic|IssueComment), sót các
-- nhánh morph tới issueMerchant, issueStatus, shift, shiftTemplate, specialDay
-- trên attachment / noteTarget / taskTarget / timelineActivity, và sót luôn vế
-- ngược (issue.attachments, merchant.timelineActivities...). Vế ngược đã đi
-- theo object sang app, không còn đích, và `issue.attachments` chặn field FILES
-- cùng tên của task-manager. Sync xác thực cả graph nên một field sót là mọi
-- `apply` đều hỏng.
--
-- Trước khi xoá, cột join của mỗi field được chép sang
-- "_cutover_link_<bảng>_<cột>" (source_id, target_id) như
-- task-manager/scripts/04-preserve-cross-object-links.sql, bảng đã có thì giữ.

\set ON_ERROR_STOP on

\if :{?schema}
\else
  \echo 'Thieu -v schema=<workspace_schema>'
  \quit
\endif

SELECT set_config('cutover.schema', :'schema', false);

DO $$
DECLARE
  target_schema text := current_setting('cutover.schema');
  orphan record;
  link_table text;
  saved bigint;
BEGIN
  CREATE TEMP TABLE orphan_relation ON COMMIT DROP AS
  SELECT f.id, f."relationTargetFieldMetadataId" AS inverse_id,
         o."nameSingular" AS source_object, f.name,
         f.settings->>'joinColumnName' AS join_column
  FROM core."fieldMetadata" f
  JOIN core.application owner ON owner.id = f."applicationId"
    AND owner."universalIdentifier" = '20202020-64aa-4b6f-b003-9c74b97cee20'
  JOIN core."objectMetadata" o ON o.id = f."objectMetadataId"
  JOIN core."objectMetadata" target ON target.id = f."relationTargetObjectMetadataId"
  WHERE f.type IN ('RELATION', 'MORPH_RELATION')
    AND target."applicationId" <> owner.id
    AND target."applicationId" IN (
      SELECT id FROM core.application
      WHERE "universalIdentifier" IN (
        '819550d5-882b-4b96-8afd-b02e0d2b41c1',  -- Task Manager
        'f933e505-1fbd-425d-8906-5a9d2e3c73a8'   -- Shift Management
      )
    );

  FOR orphan IN SELECT * FROM orphan_relation WHERE join_column IS NOT NULL LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = target_schema
        AND table_name = orphan.source_object
        AND column_name = orphan.join_column
    ) THEN
      CONTINUE;
    END IF;

    link_table := format('_cutover_link_%s_%s', orphan.source_object, orphan.join_column);

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I.%I (source_id uuid, target_id uuid)',
      target_schema, link_table);

    EXECUTE format(
      'INSERT INTO %1$I.%2$I (source_id, target_id)
       SELECT s.id, s.%3$I FROM %1$I.%4$I s
       WHERE s.%3$I IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM %1$I.%2$I l WHERE l.source_id = s.id)',
      target_schema, link_table, orphan.join_column, orphan.source_object);

    EXECUTE format('SELECT count(*) FROM %I.%I', target_schema, link_table) INTO saved;
    RAISE NOTICE 'Da luu % lien ket %.%', saved, orphan.source_object, orphan.join_column;
  END LOOP;

  CREATE TEMP TABLE orphan_field ON COMMIT DROP AS
  SELECT id FROM orphan_relation
  UNION
  SELECT inverse_id FROM orphan_relation WHERE inverse_id IS NOT NULL;

  UPDATE core."fieldMetadata" SET "relationTargetFieldMetadataId" = NULL
   WHERE "relationTargetFieldMetadataId" IN (SELECT id FROM orphan_field);

  DELETE FROM core."fieldMetadata" WHERE id IN (SELECT id FROM orphan_field);

  RAISE NOTICE 'Da xoa % field quan he mo coi (ca hai ve)', (SELECT count(*) FROM orphan_field);
END $$;

-- Phải ra rỗng: không field quan hệ nào trỏ vào object không tồn tại hoặc
-- field đích không tồn tại.
SELECT o."nameSingular", f.name
FROM core."fieldMetadata" f
JOIN core."objectMetadata" o ON o.id = f."objectMetadataId"
LEFT JOIN core."fieldMetadata" inverse ON inverse.id = f."relationTargetFieldMetadataId"
WHERE f.type IN ('RELATION', 'MORPH_RELATION')
  AND inverse.id IS NULL;

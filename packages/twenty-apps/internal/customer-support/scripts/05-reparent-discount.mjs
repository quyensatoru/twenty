// Bước 5 — chuyển `discount` (custom object tạo bằng UI) sang Customer Support.
//
//   node scripts/05-reparent-discount.mjs            # dry-run, chỉ in kế hoạch
//   node scripts/05-reparent-discount.mjs --apply    # ghi, một transaction
//
// Chạy sau 01-create-application.sql, TRƯỚC `twenty apply` bản có discount.
// Xem MIGRATION.md §"Discount" cho thứ tự đầy đủ và cổng kiểm tra.
//
// Không đọc cứng app nguồn: chủ hiện tại của object được đọc từ DB (trên
// production là application "Custom" của workspace), vì UID của nó khác nhau
// giữa các workspace.
//
// Ghi lại UID theo đúng công thức engine dùng
// (twenty-shared/src/application/deterministic-identifier):
//   field thường/hệ thống  v5(`fieldMetadata:${objectUid}:${name}`, app)
//   quan hệ hệ thống       v5(`fieldMetadata:${objectUid}:systemRelation:${targetUid}`, app)
//   index                  v5(`index:${objectUid}:${indexName}`, app)
//   searchField            v5(`searchFieldMetadata:${fieldUid}`, app)
// Field có UID literal (tạo tay trong UI) giữ nguyên: app khai lại đúng UID đó.
// Quan hệ hệ thống (timeline, notes, tasks, attachments, chats) luôn được đặt
// lại theo công thức, kể cả khi đang literal, vì app sync tự sinh chúng.
// View và navigation item KHÔNG đổi chủ: đó là phần người dùng tự tạo.

import pg from 'pg';
import { v5 as uuidv5 } from 'uuid';

const TO_APPLICATION_UID = '37713d9d-6058-4b15-bac2-6a8f2f234e5a';
const DISCOUNT_OBJECT_UID = '5c6ede8f-c6e5-41d2-a9f2-75b8f0f14c9e';

const shouldApply = process.argv.includes('--apply');

const derive = (applicationUid, entityNamespace, value) =>
  uuidv5(`${entityNamespace}:${value}`, applicationUid);

const client = new pg.Client({
  connectionString:
    process.env.PG_DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5432/default',
});

await client.connect();

const { rows: targets } = await client.query(
  `SELECT o.id AS object_id,
          o."workspaceId" AS workspace_id,
          source.id AS from_application_id,
          source."universalIdentifier" AS from_application_uid,
          source.name AS from_application_name,
          support.id AS to_application_id
     FROM core."objectMetadata" o
     JOIN core.application source ON source.id = o."applicationId"
     JOIN core.application support
       ON support."workspaceId" = o."workspaceId"
      AND support."universalIdentifier" = $2::uuid
      AND support."deletedAt" IS NULL
    WHERE o."universalIdentifier" = $1::uuid`,
  [DISCOUNT_OBJECT_UID, TO_APPLICATION_UID],
);

if (targets.length === 0) {
  console.log(
    'Không thấy discount nào cần chuyển (chưa có object, hoặc chưa chạy 01-create-application.sql).',
  );
  await client.end();
  process.exit(0);
}

const plans = [];

for (const target of targets) {
  if (target.from_application_id === target.to_application_id) {
    console.log(`workspace ${target.workspace_id}: đã thuộc Customer Support, bỏ qua.`);
    continue;
  }

  const fromUid = target.from_application_uid;

  const { rows: fields } = await client.query(
    `SELECT f.id, f.name, f."universalIdentifier" AS uid,
            f."isSystemSideEffect" AS is_side_effect,
            o."universalIdentifier" AS object_uid,
            t."universalIdentifier" AS target_object_uid
       FROM core."fieldMetadata" f
       JOIN core."objectMetadata" o ON o.id = f."objectMetadataId"
       LEFT JOIN core."objectMetadata" t ON t.id = f."relationTargetObjectMetadataId"
      WHERE f."applicationId" = $1
        AND (f."objectMetadataId" = $2 OR f."relationTargetObjectMetadataId" = $2)`,
    [target.from_application_id, target.object_id],
  );

  const fieldChanges = fields.map((field) => {
    const regularFrom = derive(fromUid, 'fieldMetadata', `${field.object_uid}:${field.name}`);
    let to = field.uid;

    if (field.is_side_effect && field.target_object_uid !== null) {
      to = derive(
        TO_APPLICATION_UID,
        'fieldMetadata',
        `${field.object_uid}:systemRelation:${field.target_object_uid}`,
      );
    } else if (field.uid === regularFrom) {
      to = derive(TO_APPLICATION_UID, 'fieldMetadata', `${field.object_uid}:${field.name}`);
    }

    return { ...field, to };
  });

  const newUidByOldUid = new Map(fieldChanges.map((field) => [field.uid, field.to]));

  const { rows: indexes } = await client.query(
    `SELECT i.id, i.name, i."universalIdentifier" AS uid
       FROM core."indexMetadata" i
      WHERE i."objectMetadataId" = $1 AND i."applicationId" = $2`,
    [target.object_id, target.from_application_id],
  );
  // Index literal (thường là index của cột appId) ở lại chủ cũ: app không
  // khai nó, chuyển sang thì `twenty apply` sẽ xoá.
  const indexChanges = indexes
    .filter(
      (index) =>
        index.uid === derive(fromUid, 'index', `${DISCOUNT_OBJECT_UID}:${index.name}`),
    )
    .map((index) => ({
      ...index,
      to: derive(TO_APPLICATION_UID, 'index', `${DISCOUNT_OBJECT_UID}:${index.name}`),
    }));

  const { rows: searchFields } = await client.query(
    `SELECT s.id, s."universalIdentifier" AS uid, f."universalIdentifier" AS field_uid
       FROM core."searchFieldMetadata" s
       JOIN core."fieldMetadata" f ON f.id = s."fieldMetadataId"
      WHERE s."objectMetadataId" = $1 AND s."applicationId" = $2`,
    [target.object_id, target.from_application_id],
  );
  const searchChanges = searchFields.map((searchField) => ({
    ...searchField,
    to: derive(
      TO_APPLICATION_UID,
      'searchFieldMetadata',
      newUidByOldUid.get(searchField.field_uid) ?? searchField.field_uid,
    ),
  }));

  plans.push({ target, fieldChanges, indexChanges, searchChanges });

  console.log(
    `\nworkspace ${target.workspace_id}: ${target.from_application_name} -> Customer Support`,
  );
  console.log(`  field: ${fieldChanges.length}`);
  for (const field of fieldChanges) {
    console.log(
      `    ${field.name.padEnd(24)} ${field.uid === field.to ? 'giữ UID' : `${field.uid} -> ${field.to}`}`,
    );
  }
  console.log(`  index chuyển: ${indexChanges.length}, giữ lại: ${indexes.length - indexChanges.length}`);
  console.log(`  searchField: ${searchChanges.length}`);
}

if (!shouldApply) {
  console.log('\n(dry-run — thêm --apply để ghi)');
  await client.end();
  process.exit(0);
}

await client.query('BEGIN');

try {
  for (const { target, fieldChanges, indexChanges, searchChanges } of plans) {
    await client.query(
      'UPDATE core."objectMetadata" SET "applicationId" = $1 WHERE id = $2',
      [target.to_application_id, target.object_id],
    );

    for (const field of fieldChanges) {
      await client.query(
        'UPDATE core."fieldMetadata" SET "applicationId" = $1, "universalIdentifier" = $2 WHERE id = $3',
        [target.to_application_id, field.to, field.id],
      );
    }

    for (const index of indexChanges) {
      await client.query(
        'UPDATE core."indexMetadata" SET "applicationId" = $1, "universalIdentifier" = $2 WHERE id = $3',
        [target.to_application_id, index.to, index.id],
      );
    }

    for (const searchField of searchChanges) {
      await client.query(
        'UPDATE core."searchFieldMetadata" SET "applicationId" = $1, "universalIdentifier" = $2 WHERE id = $3',
        [target.to_application_id, searchField.to, searchField.id],
      );
    }
  }

  await client.query('COMMIT');
  console.log('\nĐã ghi. Chạy cache:flush rồi `twenty plan` (phải 0 destroy) trước khi apply.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}

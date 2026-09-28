// Bước 2b của CUTOVER.md — viết lại universalIdentifier dẫn xuất sau khi re-parent.
//
//   node packages/twenty-apps/internal/rewrite-derived-identifiers.mjs --dry-run
//   node packages/twenty-apps/internal/rewrite-derived-identifiers.mjs --apply
//
// Vì sao cần: universalIdentifier của field hệ thống (id, createdAt, updatedAt,
// deletedAt, position, createdBy, updatedBy, searchVector) và của relation hệ
// thống KHÔNG phải hằng số — engine dẫn xuất chúng bằng
//
//   v5(`fieldMetadata:${objectUid}:${name}`, applicationUniversalIdentifier)
//
// với applicationUniversalIdentifier làm NAMESPACE của UUIDv5. Đổi chủ sở hữu
// object là đổi namespace, nên mọi UID dẫn xuất phải được tính lại. Không làm
// bước này thì `twenty apply` báo "Field metadata not found" và
// "already exists in ... maps from application 20202020-…" rồi dừng.
//
// Script chỉ ghi đè dòng mà UID hiện tại khớp ĐÚNG giá trị dẫn xuất theo
// Standard — dòng có UID literal do người viết đặt thì không đụng tới.

import { v5 as uuidv5 } from 'uuid';
import pg from 'pg';

const STANDARD_APPLICATION_UID = '20202020-64aa-4b6f-b003-9c74b97cee20';

const APPLICATIONS = {
  'Task Manager': '819550d5-882b-4b96-8afd-b02e0d2b41c1',
  'Shift Management': 'f933e505-1fbd-425d-8906-5a9d2e3c73a8',
};

const derive = (namespaceApplicationUid, value) =>
  uuidv5(`fieldMetadata:${value}`, namespaceApplicationUid);

const shouldApply = process.argv.includes('--apply');

const client = new pg.Client({
  connectionString:
    process.env.PG_DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5432/default',
});

await client.connect();

const { rows } = await client.query(
  `SELECT f.id,
          f.name,
          f."universalIdentifier"                AS field_uid,
          o."universalIdentifier"                AS object_uid,
          o."nameSingular"                       AS object_name,
          a.name                                 AS owner,
          target."universalIdentifier"           AS target_object_uid
     FROM core."fieldMetadata" f
     JOIN core."objectMetadata" o ON o.id = f."objectMetadataId"
     JOIN core.application a      ON a.id = o."applicationId"
     LEFT JOIN core."objectMetadata" target
            ON target.id = (f.settings->>'relationTargetObjectMetadataId')::uuid
    WHERE a.name = ANY($1::text[])`,
  [Object.keys(APPLICATIONS)],
);

const updates = [];

for (const row of rows) {
  const applicationUid = APPLICATIONS[row.owner];

  // Hai cách dẫn xuất engine dùng: field thường theo tên, relation hệ thống
  // theo object đích.
  const candidates = [`${row.object_uid}:${row.name}`];

  if (row.target_object_uid) {
    candidates.push(
      `${row.object_uid}:systemRelation:${row.target_object_uid}`,
    );
  }

  for (const value of candidates) {
    if (row.field_uid === derive(STANDARD_APPLICATION_UID, value)) {
      updates.push({
        id: row.id,
        object: row.object_name,
        field: row.name,
        from: row.field_uid,
        to: derive(applicationUid, value),
      });
      break;
    }
  }
}

console.log(`Field dẫn xuất theo Standard cần viết lại: ${updates.length}`);
for (const u of updates.slice(0, 8)) {
  console.log(`  ${u.object}.${u.field}  ${u.from} -> ${u.to}`);
}
if (updates.length > 8) console.log(`  ... và ${updates.length - 8} dòng nữa`);

if (!shouldApply) {
  console.log('\n(dry-run — thêm --apply để ghi)');
  await client.end();
  process.exit(0);
}

await client.query('BEGIN');
try {
  for (const u of updates) {
    await client.query(
      'UPDATE core."fieldMetadata" SET "universalIdentifier" = $1 WHERE id = $2',
      [u.to, u.id],
    );
  }
  await client.query('COMMIT');
  console.log(`\nĐã ghi ${updates.length} dòng.`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('ROLLBACK:', error.message);
  process.exitCode = 1;
}

await client.end();

// Bước 3 — viết lại universalIdentifier dẫn xuất của `merchant` sau khi
// re-parent.
//
//   node scripts/03-rewrite-derived-identifiers.mjs --dry-run
//   node scripts/03-rewrite-derived-identifiers.mjs --apply
//
// Vì sao cần: UID của field hệ thống (id, createdAt, updatedAt, deletedAt,
// position, createdBy, updatedBy, searchVector) không phải hằng số — engine
// dẫn xuất chúng bằng
//
//   v5(`fieldMetadata:${objectUid}:${name}`, applicationUniversalIdentifier)
//
// (compute-deterministic-uuid.util.ts) với application UID làm NAMESPACE. Đổi
// chủ object là đổi namespace, nên phải tính lại. Bỏ bước này thì `twenty
// apply` báo "Field metadata not found" rồi dừng.
//
// Khác với ../rewrite-derived-identifiers.mjs: script kia dịch từ namespace
// Standard sang app, lần này nguồn là namespace Task Manager.
//
// An toàn: chỉ ghi đè dòng mà UID hiện tại khớp ĐÚNG giá trị dẫn xuất theo
// namespace cũ. Dòng có UID literal do người viết đặt (name, customSettings,
// app, issues) không bao giờ khớp nên không bị đụng.

import { v5 as uuidv5 } from 'uuid';
import pg from 'pg';

const FROM_APPLICATION_UID = '819550d5-882b-4b96-8afd-b02e0d2b41c1';
const TO_APPLICATION_UID = '37713d9d-6058-4b15-bac2-6a8f2f234e5a';
const MERCHANT_OBJECT_UID = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca';

const derive = (namespaceApplicationUid, entityNamespace, value) =>
  uuidv5(`${entityNamespace}:${value}`, namespaceApplicationUid);

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
          f."universalIdentifier" AS field_uid,
          o."universalIdentifier" AS object_uid
     FROM core."fieldMetadata" f
     JOIN core."objectMetadata" o ON o.id = f."objectMetadataId"
    WHERE o."universalIdentifier" = $1::uuid`,
  [MERCHANT_OBJECT_UID],
);

const fieldUpdates = [];

for (const row of rows) {
  const value = `${row.object_uid}:${row.name}`;

  if (row.field_uid === derive(FROM_APPLICATION_UID, 'fieldMetadata', value)) {
    fieldUpdates.push({
      id: row.id,
      name: row.name,
      from: row.field_uid,
      to: derive(TO_APPLICATION_UID, 'fieldMetadata', value),
    });
  }
}

// searchFieldMetadata được khoá theo UID của field nó làm cho searchable, nên
// nó chỉ tính lại được SAU khi biết UID mới của field đó.
const { rows: searchRows } = await client.query(
  `SELECT sfm.id, sfm."universalIdentifier" AS sfm_uid
     FROM core."searchFieldMetadata" sfm
     JOIN core."objectMetadata" o ON o.id = sfm."objectMetadataId"
    WHERE o."universalIdentifier" = $1::uuid`,
  [MERCHANT_OBJECT_UID],
);

const searchUpdates = [];

for (const row of searchRows) {
  for (const fieldUpdate of fieldUpdates) {
    if (
      row.sfm_uid ===
      derive(FROM_APPLICATION_UID, 'searchFieldMetadata', fieldUpdate.from)
    ) {
      searchUpdates.push({
        id: row.id,
        name: `searchFieldMetadata(${fieldUpdate.name})`,
        from: row.sfm_uid,
        to: derive(TO_APPLICATION_UID, 'searchFieldMetadata', fieldUpdate.to),
      });
    }
  }
}

const updates = [...fieldUpdates, ...searchUpdates];

console.log(`Field dẫn xuất cần viết lại: ${fieldUpdates.length}`);
console.log(`searchFieldMetadata cần viết lại: ${searchUpdates.length}`);
for (const update of updates) {
  console.log(`  ${update.name}  ${update.from} -> ${update.to}`);
}

// Không khớp công thức nào: có thể chúng sinh ra trước khi object mang UID
// hiện tại. Không đoán — báo ra để người chạy quyết định, vì `twenty apply`
// có thể vẫn từ chối chúng sau khi đổi chủ.
const unmatchedSearch = searchRows.length - searchUpdates.length;

if (unmatchedSearch > 0) {
  console.log(
    `\nCẢNH BÁO: ${unmatchedSearch} dòng searchFieldMetadata không khớp công thức dẫn xuất nào và bị bỏ qua.`,
  );
}

if (!shouldApply) {
  console.log('\n(dry-run — thêm --apply để ghi)');
  await client.end();
  process.exit(0);
}

await client.query('BEGIN');
try {
  for (const update of fieldUpdates) {
    await client.query(
      'UPDATE core."fieldMetadata" SET "universalIdentifier" = $1 WHERE id = $2',
      [update.to, update.id],
    );
  }
  for (const update of searchUpdates) {
    await client.query(
      'UPDATE core."searchFieldMetadata" SET "universalIdentifier" = $1 WHERE id = $2',
      [update.to, update.id],
    );
  }
  await client.query('COMMIT');
  console.log(`\nĐã ghi ${updates.length} dòng.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
}

await client.end();

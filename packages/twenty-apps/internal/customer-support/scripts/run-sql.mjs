// Chạy một file .sql qua node-pg vì psql không chắc có trong môi trường này.
// Bỏ các meta-command của psql (dòng bắt đầu bằng \) — node-pg không hiểu.
// Cả file chạy trên MỘT connection để TEMP TABLE sống qua các câu lệnh.
import { readFileSync } from 'node:fs';
import pg from 'pg';

const [, , sqlPath] = process.argv;

const sql = readFileSync(sqlPath, 'utf8')
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('\\'))
  .join('\n');

const client = new pg.Client({
  connectionString:
    process.env.PG_DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5432/default',
});

await client.connect();

try {
  const result = await client.query(sql);
  const results = Array.isArray(result) ? result : [result];

  for (const one of results) {
    if (one.command === 'SELECT' && one.rows.length > 0) {
      console.table(one.rows);
    } else if (one.rowCount !== null && one.command !== 'SELECT') {
      console.log(`${one.command} ${one.rowCount}`);
    }
  }
  console.log(`\nOK: ${sqlPath}`);
} catch (error) {
  console.error(`FAILED: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

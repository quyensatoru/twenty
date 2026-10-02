// GOLIVE_RUNBOOK.md 2.7, before `upgrade`: make the fork's upgrade history
// readable by the apps/zero-core server.
//
//   cd packages/twenty-server && NODE_ENV=production \
//     node ../twenty-apps/internal/cutover-reconcile-upgrade-history.mjs [--apply]
//
// Two mismatches stop `upgrade` cold or make it skip work silently:
//
// 1. The fork ran its own upgrade commands (epic, merchant, shift, nav items...)
//    that this branch does not ship. The upgrade cursor is the most recently
//    attempted step, so when that step is a fork-only one the sequence reader
//    throws "Step ... not found in upgrade sequence". Those rows are moved to
//    core."_cutoverForkUpgradeMigration", not deleted, so the history survives.
//
// 2. This branch has instance commands at versions the fork already went past
//    (2.42.0 settings menu items, view group load limit). The cursor sits in a
//    later workspace segment, so `upgrade` starts after them and never runs
//    them. They are run here through the server's own runner, which records
//    them exactly like `upgrade` does.
//
// Runs against the database in packages/twenty-server/.env (PG_DATABASE_URL).
import { createRequire } from 'module';
import path from 'path';

const shouldApply = process.argv.includes('--apply');
const serverDirectory = process.cwd();
const require = createRequire(path.join(serverDirectory, 'package.json'));

require('dotenv').config({ path: path.join(serverDirectory, '.env') });

const { NestFactory } = require('@nestjs/core');
const { CommandModule } = require(path.join(serverDirectory, 'dist/command/command.module.js'));
const { UpgradeSequenceReaderService } = require(
  path.join(serverDirectory, 'dist/engine/core-modules/upgrade/services/upgrade-sequence-reader.service.js'),
);
const { InstanceCommandRunnerService } = require(
  path.join(serverDirectory, 'dist/engine/core-modules/upgrade/services/instance-command-runner.service.js'),
);
const { DataSource } = require('typeorm');

const app = await NestFactory.createApplicationContext(CommandModule, {
  logger: ['error', 'warn'],
});

try {
  const dataSource = app.get(DataSource);
  const sequenceReader = app.get(UpgradeSequenceReaderService);
  const instanceRunner = app.get(InstanceCommandRunnerService);

  const sequence = sequenceReader.getUpgradeSequence();
  const knownStepNames = new Set(sequence.map((step) => step.name));

  const appliedRows = await dataSource.query(
    `SELECT DISTINCT name FROM core."upgradeMigration"`,
  );
  const appliedNames = new Set(appliedRows.map((row) => row.name));
  const forkOnlyNames = [...appliedNames].filter((name) => !knownStepNames.has(name)).sort();

  console.log(`Fork-only steps in history: ${forkOnlyNames.length}`);
  for (const name of forkOnlyNames) console.log(`  ${name}`);

  // Every step up to the newest one the fork completed counts as "behind the
  // cursor"; instance steps there that never ran are the ones upgrade skips.
  const lastKnownAppliedIndex = sequence.reduce(
    (last, step, index) => (appliedNames.has(step.name) ? index : last),
    -1,
  );
  const skippedInstanceSteps = sequence
    .slice(0, lastKnownAppliedIndex + 1)
    .filter((step) => step.kind !== 'workspace' && !appliedNames.has(step.name));

  console.log(`\nInstance steps behind the cursor that never ran: ${skippedInstanceSteps.length}`);
  for (const step of skippedInstanceSteps) console.log(`  [${step.kind}] ${step.name}`);

  if (!shouldApply) {
    console.log('\n(dry-run — add --apply to write)');
  } else {
    await dataSource.transaction(async (manager) => {
      await manager.query(
        `CREATE TABLE IF NOT EXISTS core."_cutoverForkUpgradeMigration"
           (LIKE core."upgradeMigration" INCLUDING DEFAULTS)`,
      );
      await manager.query(
        `INSERT INTO core."_cutoverForkUpgradeMigration"
         SELECT * FROM core."upgradeMigration" WHERE name = ANY($1)
         ON CONFLICT DO NOTHING`,
        [forkOnlyNames],
      );
      await manager.query(
        `DELETE FROM core."upgradeMigration" WHERE name = ANY($1)`,
        [forkOnlyNames],
      );
    });
    console.log(`\nMoved ${forkOnlyNames.length} fork-only step(s) to core."_cutoverForkUpgradeMigration"`);

    const workspaceRows = await dataSource.query(
      `SELECT id FROM core.workspace WHERE "deletedAt" IS NULL`,
    );

    for (const step of skippedInstanceSteps) {
      const result =
        step.kind === 'fast-instance'
          ? await instanceRunner.runFastInstanceCommand({ command: step.command, name: step.name })
          : await instanceRunner.runSlowInstanceCommand({
              command: step.command,
              name: step.name,
              skipDataMigration: workspaceRows.length === 0,
            });

      console.log(`  ${step.name}: ${result.status}`);

      if (result.status === 'failed') {
        throw result.error;
      }
    }
  }
} finally {
  await app.close();
}

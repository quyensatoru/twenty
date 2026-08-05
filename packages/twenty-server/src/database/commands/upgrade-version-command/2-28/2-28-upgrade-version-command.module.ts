import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { BackfillIssueStatusDataCommand } from 'src/database/commands/upgrade-version-command/2-28/2-28-workspace-command-1784930001000-backfill-issue-status-data.command';
import { BackfillIssueStatusSearchFieldMetadataCommand } from 'src/database/commands/upgrade-version-command/2-28/2-28-workspace-command-1784930001500-backfill-issue-status-search-field-metadata.command';
import { SyncIssueStatusStandardObjectsCommand } from 'src/database/commands/upgrade-version-command/2-28/2-28-workspace-command-1784930000000-sync-issue-status-standard-objects.command';
import { SyncIssueEpicSprintAppScopeRelationsCommand } from 'src/database/commands/upgrade-version-command/2-28/2-28-workspace-command-1784930002000-sync-issue-epic-sprint-app-scope-relations.command';
import { SyncIssueMerchantStandardObjectCommand } from 'src/database/commands/upgrade-version-command/2-28/2-28-workspace-command-1784930003000-sync-issue-merchant-standard-object.command';
import { BackfillIssueMerchantSearchFieldMetadataCommand } from 'src/database/commands/upgrade-version-command/2-28/2-28-workspace-command-1784930003500-backfill-issue-merchant-search-field-metadata.command';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';
import { ProjectQueryHookModule } from 'src/modules/project/query-hooks/project-query-hook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMetadataEntity, ApplicationEntity]),
    ApplicationModule,
    WorkspaceCacheModule,
    WorkspaceMigrationModule,
    WorkspaceMigrationRunnerModule,
    WorkspaceIteratorModule,
    ProjectQueryHookModule,
  ],
  providers: [
    SyncIssueStatusStandardObjectsCommand,
    BackfillIssueStatusDataCommand,
    BackfillIssueStatusSearchFieldMetadataCommand,
    SyncIssueEpicSprintAppScopeRelationsCommand,
    SyncIssueMerchantStandardObjectCommand,
    BackfillIssueMerchantSearchFieldMetadataCommand,
  ],
})
export class V2_28_UpgradeVersionCommandModule {}

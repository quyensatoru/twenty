import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { BackfillEpicIssueDataCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1784910001000-backfill-epic-issue-data.command';
import { BackfillEpicSearchFieldMetadataCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1784910000500-backfill-epic-search-field-metadata.command';
import { SyncTimelineActivityIssueEpicTargetsCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1784910002000-sync-timeline-activity-issue-epic-targets.command';
import { SyncIssueEpicTimelineTabCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1784910003000-sync-issue-epic-timeline-tab.command';
import { SyncEpicStandardObjectsCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1784910000000-sync-epic-standard-objects.command';
import { ReconcileIndexViewUniversalIdentifierCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1785255689000-reconcile-index-view-universal-identifier.command';
import { DemoteAndBackfillApplicationIndexViewCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1785255690000-demote-and-backfill-application-index-view.command';
import { AddNotRecordedCallRecordingStatusCommand } from 'src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1785334800000-add-not-recorded-call-recording-status.command';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ViewEntity } from 'src/engine/metadata-modules/view/entities/view.entity';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMetadataEntity, ApplicationEntity, ViewEntity]),
    ApplicationModule,
    WorkspaceCacheModule,
    WorkspaceMigrationModule,
    WorkspaceMigrationRunnerModule,
    WorkspaceIteratorModule,
  ],
  providers: [
    SyncEpicStandardObjectsCommand,
    BackfillEpicSearchFieldMetadataCommand,
    BackfillEpicIssueDataCommand,
    SyncTimelineActivityIssueEpicTargetsCommand,
    SyncIssueEpicTimelineTabCommand,
    ReconcileIndexViewUniversalIdentifierCommand,
    DemoteAndBackfillApplicationIndexViewCommand,
    AddNotRecordedCallRecordingStatusCommand,
  ],
})
export class V2_26_UpgradeVersionCommandModule {}

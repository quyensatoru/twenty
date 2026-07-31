import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { BackfillMerchantSearchFieldMetadataCommand } from 'src/database/commands/upgrade-version-command/2-27/2-27-workspace-command-1784920000500-backfill-merchant-search-field-metadata.command';
import { SyncMerchantStandardObjectsCommand } from 'src/database/commands/upgrade-version-command/2-27/2-27-workspace-command-1784920000000-sync-merchant-standard-objects.command';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMetadataEntity, ApplicationEntity]),
    ApplicationModule,
    WorkspaceCacheModule,
    WorkspaceMigrationModule,
    WorkspaceMigrationRunnerModule,
    WorkspaceIteratorModule,
  ],
  providers: [
    SyncMerchantStandardObjectsCommand,
    BackfillMerchantSearchFieldMetadataCommand,
  ],
})
export class V2_27_UpgradeVersionCommandModule {}

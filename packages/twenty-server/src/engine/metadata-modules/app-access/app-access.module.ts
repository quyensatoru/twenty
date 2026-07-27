import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { WorkspaceAppGrantsCacheService } from 'src/engine/metadata-modules/app-access/services/workspace-app-grants-cache.service';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';

// Registers the `appScopeGrants` workspace cache provider (member -> app ->
// granted permissions, plus the raw all-object-records role flags used for
// app-scope bypass). Discovered automatically by WorkspaceCacheService via
// NestJS's DiscoveryService, so this module only needs to be imported
// somewhere in the app's module graph — see MetadataEngineModule.
@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity])],
  providers: [
    WorkspaceAppGrantsCacheService,
    provideWorkspaceScopedRepository(RoleEntity),
  ],
})
export class AppAccessModule {}

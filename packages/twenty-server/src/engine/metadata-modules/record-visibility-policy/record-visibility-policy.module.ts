import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { RecordVisibilityPolicyEntity } from 'src/engine/metadata-modules/record-visibility-policy/entities/record-visibility-policy.entity';
import { RecordVisibilityPolicyService } from 'src/engine/metadata-modules/record-visibility-policy/services/record-visibility-policy.service';
import { WorkspaceRecordVisibilityPolicyCacheService } from 'src/engine/metadata-modules/record-visibility-policy/services/workspace-record-visibility-policy-cache.service';
import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

// OSS equivalent of RowLevelPermissionModule — see
// RECORD_VISIBILITY_POLICY_SPEC.md. Registers both the `recordVisibilityPolicy`
// core-schema repository and the `recordVisibilityPolicies` workspace cache
// provider (auto-discovered by WorkspaceCacheService via NestJS's
// DiscoveryService — this module only needs to be imported somewhere in the
// app's module graph, see RoleModule).
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecordVisibilityPolicyEntity,
      RoleEntity,
      ObjectMetadataEntity,
    ]),
    WorkspaceCacheModule,
  ],
  providers: [
    RecordVisibilityPolicyService,
    WorkspaceRecordVisibilityPolicyCacheService,
    provideWorkspaceScopedRepository(RecordVisibilityPolicyEntity),
    provideWorkspaceScopedRepository(RoleEntity),
  ],
  exports: [RecordVisibilityPolicyService],
})
export class RecordVisibilityPolicyModule {}

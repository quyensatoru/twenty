import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { type Repository } from 'typeorm';

import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { RecordVisibilityPolicyEntity } from 'src/engine/metadata-modules/record-visibility-policy/entities/record-visibility-policy.entity';
import {
  type DeleteRecordVisibilityPolicyInput,
  type UpsertRecordVisibilityPolicyInput,
} from 'src/engine/metadata-modules/record-visibility-policy/dtos/upsert-record-visibility-policy.input';
import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
export class RecordVisibilityPolicyService {
  constructor(
    @InjectWorkspaceScopedRepository(RoleEntity)
    private readonly roleRepository: WorkspaceScopedRepository<RoleEntity>,
    @InjectWorkspaceScopedRepository(RecordVisibilityPolicyEntity)
    private readonly recordVisibilityPolicyRepository: WorkspaceScopedRepository<RecordVisibilityPolicyEntity>,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  public async findByWorkspaceId(
    workspaceId: string,
  ): Promise<RecordVisibilityPolicyEntity[]> {
    return this.recordVisibilityPolicyRepository.find(workspaceId);
  }

  public async upsertRecordVisibilityPolicy({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: UpsertRecordVisibilityPolicyInput;
  }): Promise<RecordVisibilityPolicyEntity> {
    await this.assertRoleAndObjectMetadataExistOrThrow({
      workspaceId,
      roleId: input.roleId,
      objectMetadataId: input.objectMetadataId,
    });

    const policy =
      await this.recordVisibilityPolicyRepository.upsertAndReturnOne(
        workspaceId,
        {
          roleId: input.roleId,
          objectMetadataId: input.objectMetadataId,
          filter: input.filter,
          currentMemberFieldName: input.currentMemberFieldName ?? null,
        },
        ['workspaceId', 'roleId', 'objectMetadataId'],
      );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'recordVisibilityPolicies',
    ]);

    return policy;
  }

  public async deleteRecordVisibilityPolicy({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: DeleteRecordVisibilityPolicyInput;
  }): Promise<boolean> {
    const result = await this.recordVisibilityPolicyRepository.delete(
      workspaceId,
      {
        roleId: input.roleId,
        objectMetadataId: input.objectMetadataId,
      },
    );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'recordVisibilityPolicies',
    ]);

    return (result.affected ?? 0) > 0;
  }

  private async assertRoleAndObjectMetadataExistOrThrow({
    workspaceId,
    roleId,
    objectMetadataId,
  }: {
    workspaceId: string;
    roleId: string;
    objectMetadataId: string;
  }): Promise<void> {
    const role = await this.roleRepository.findOneBy(workspaceId, {
      id: roleId,
    });

    if (!isDefined(role)) {
      throw new PermissionsException(
        PermissionsExceptionMessage.ROLE_NOT_FOUND,
        PermissionsExceptionCode.ROLE_NOT_FOUND,
      );
    }

    const objectMetadata = await this.objectMetadataRepository.findOne({
      where: { id: objectMetadataId, workspaceId },
    });

    if (!isDefined(objectMetadata)) {
      throw new PermissionsException(
        PermissionsExceptionMessage.OBJECT_METADATA_NOT_FOUND,
        PermissionsExceptionCode.OBJECT_METADATA_NOT_FOUND,
      );
    }
  }
}

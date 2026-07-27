import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { type RecordGqlOperationFilter } from 'twenty-shared/types';

import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

// OSS equivalent of Enterprise's rowLevelPermissionPredicate(Group), scoped to
// one (role, object) pair like the original — deliberately simplified to a
// single jsonb filter tree instead of 2 normalized tables (see
// RECORD_VISIBILITY_POLICY_SPEC.md §4). Not a SyncableEntity: no
// universalIdentifier/applicationId, so it never flows through the
// workspace-migration / application-manifest sync machinery — plain
// core-schema CRUD via WorkspaceScopedRepository is enough.
@Entity({ name: 'recordVisibilityPolicy', schema: 'core' })
@Index('IDX_RECORD_VISIBILITY_POLICY_WORKSPACE_ROLE_OBJECT_UNIQUE', [
  'workspaceId',
  'roleId',
  'objectMetadataId',
], { unique: true })
export class RecordVisibilityPolicyEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Relation<RoleEntity>;

  @Column({ nullable: false, type: 'uuid' })
  objectMetadataId: string;

  @ManyToOne(() => ObjectMetadataEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'objectMetadataId' })
  objectMetadata: Relation<ObjectMetadataEntity>;

  @Column({ nullable: false, type: 'jsonb', default: {} })
  filter: RecordGqlOperationFilter;

  // If set, the field name (on this workspace's WorkspaceMember object) that
  // the current member's own id should be substituted for wherever the
  // `$$CURRENT_MEMBER$$` placeholder appears inside `filter` at query time —
  // v1 only supports comparing against workspaceMember.id itself (see spec §10.1).
  @Column({ nullable: true, type: 'text', default: null })
  currentMemberFieldName: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AppWorkspaceEntity } from 'src/modules/app/standard-objects/app.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class AppAccessWorkspaceEntity extends BaseWorkspaceEntity {
  member: EntityRelation<WorkspaceMemberWorkspaceEntity>;
  memberId: string;
  app: EntityRelation<AppWorkspaceEntity>;
  appId: string;
  permissions: string[] | null;
}

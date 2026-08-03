import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AppWorkspaceEntity } from 'src/modules/app/standard-objects/app.workspace-entity';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';

export class MerchantWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  customSettings: Record<string, unknown> | null;
  app: EntityRelation<AppWorkspaceEntity> | null;
  appId: string | null;
  issues: EntityRelation<IssueWorkspaceEntity[]>;
  searchVector: string;
}

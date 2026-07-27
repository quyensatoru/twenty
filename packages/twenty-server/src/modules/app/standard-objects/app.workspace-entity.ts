import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class AppWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
}

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type MerchantWorkspaceEntity } from 'src/modules/merchant/standard-objects/merchant.workspace-entity';

export class AppWorkspaceEntity extends BaseWorkspaceEntity {
  name: string | null;
  fieldSchema: Array<{ key: string; label: string; type: string }> | null;
  merchants: EntityRelation<MerchantWorkspaceEntity[]>;
}

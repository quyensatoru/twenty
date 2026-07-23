import { type ActorMetadata, type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class ProjectWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  name: string;
  key: string;
  nextIssueNumber: number;
  description: RichTextMetadata | null;
  category: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  lead: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  leadId: string | null;
  searchVector: string;
}

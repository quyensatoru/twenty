import { type ActorMetadata, type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class IssueCommentWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  bodyV2: RichTextMetadata | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  issue: EntityRelation<IssueWorkspaceEntity>;
  issueId: string;
  author: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  authorId: string | null;
  searchVector: string;
}

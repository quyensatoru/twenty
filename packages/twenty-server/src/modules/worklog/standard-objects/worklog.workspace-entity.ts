import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class WorklogWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  description: string | null;
  timeSpentMinutes: number | null;
  startedAt: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  issue: EntityRelation<IssueWorkspaceEntity>;
  issueId: string;
  member: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  memberId: string | null;
  searchVector: string;
}

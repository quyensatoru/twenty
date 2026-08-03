import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class SprintWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  name: string;
  state: string | null;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  completeDate: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  owner: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  ownerId: string | null;
  project: EntityRelation<ProjectWorkspaceEntity>;
  projectId: string;
  searchVector: string;
}

import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

export class IssueStatusWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  name: string;
  color: string | null;
  category: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  project: EntityRelation<ProjectWorkspaceEntity>;
  projectId: string;
  issues: EntityRelation<IssueWorkspaceEntity[]>;
  searchVector: string;
}

import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';
import { type TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';

export class EpicWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  name: string;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  project: EntityRelation<ProjectWorkspaceEntity>;
  projectId: string;
  issues: EntityRelation<IssueWorkspaceEntity[]>;
  timelineActivities: EntityRelation<TimelineActivityWorkspaceEntity[]>;
  searchVector: string;
}

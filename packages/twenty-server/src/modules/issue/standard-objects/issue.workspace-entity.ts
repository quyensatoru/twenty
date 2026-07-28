import { type ActorMetadata, type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { type EpicWorkspaceEntity } from 'src/modules/epic/standard-objects/epic.workspace-entity';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';
import { type SprintWorkspaceEntity } from 'src/modules/sprint/standard-objects/sprint.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class IssueWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  title: string;
  issueKey: string | null;
  description: RichTextMetadata | null;
  issueType: string | null;
  status: string | null;
  priority: string | null;
  resolution: string | null;
  storyPoints: number | null;
  labels: string[] | null;
  dueDate: string | null;
  originalEstimateMinutes: number | null;
  remainingEstimateMinutes: number | null;
  timeSpentMinutes: number | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  assignee: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  assigneeId: string | null;
  reporter: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  reporterId: string | null;
  project: EntityRelation<ProjectWorkspaceEntity>;
  projectId: string;
  sprint: EntityRelation<SprintWorkspaceEntity> | null;
  sprintId: string | null;
  epic: EntityRelation<EpicWorkspaceEntity> | null;
  epicId: string | null;
  parent: EntityRelation<IssueWorkspaceEntity> | null;
  parentId: string | null;
  children: EntityRelation<IssueWorkspaceEntity[]>;
  attachments: EntityRelation<AttachmentWorkspaceEntity[]>;
  searchVector: string;
}

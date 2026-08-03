import { type ActorMetadata, type RichTextMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type AppWorkspaceEntity } from 'src/modules/app/standard-objects/app.workspace-entity';
import { type EpicWorkspaceEntity } from 'src/modules/epic/standard-objects/epic.workspace-entity';
import { type IssueStatusWorkspaceEntity } from 'src/modules/issue-status/standard-objects/issue-status.workspace-entity';
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
  app: EntityRelation<AppWorkspaceEntity> | null;
  appId: string | null;
  epics: EntityRelation<EpicWorkspaceEntity[]>;
  issueStatuses: EntityRelation<IssueStatusWorkspaceEntity[]>;
  searchVector: string;
}

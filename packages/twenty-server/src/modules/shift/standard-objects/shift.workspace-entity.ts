import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type ShiftTemplateWorkspaceEntity } from 'src/modules/shift/standard-objects/shift-template.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export class ShiftWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  name: string;
  date: string;
  // 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  status: string;
  templateCode: string | null;
  templateName: string | null;
  startTime: string | null;
  endTime: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInLateMinutes: number | null;
  workingMinutes: number | null;
  rateMultiplier: number | null;
  handoverNote: string | null;
  cancelReason: string | null;
  cancelCategory: string | null;
  cancelledAt: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  member: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  memberId: string | null;
  shiftTemplate: EntityRelation<ShiftTemplateWorkspaceEntity> | null;
  shiftTemplateId: string | null;
  searchVector: string;
}

import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

export class ShiftTemplateWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  dayKind: string | null;
  earlyCheckInMinutes: number | null;
  lateCheckOutMinutes: number | null;
  salaryPerHour: number | null;
  color: string | null;
  isActive: boolean;
  description: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  shifts: EntityRelation<ShiftWorkspaceEntity[]>;
  searchVector: string;
}

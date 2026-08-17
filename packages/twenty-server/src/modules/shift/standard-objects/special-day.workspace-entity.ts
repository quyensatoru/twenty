import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class SpecialDayWorkspaceEntity extends BaseWorkspaceEntity {
  position: number;
  name: string;
  kind: string;
  month: number | null;
  day: number | null;
  date: string | null;
  multiplier: number;
  isActive: boolean;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  searchVector: string;
}

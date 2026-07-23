import { Module } from '@nestjs/common';

import { SprintCompleteResolver } from 'src/modules/sprint/resolvers/sprint-complete.resolver';
import { SprintCompleteWorkspaceService } from 'src/modules/sprint/workspace-services/sprint-complete.workspace-service';

@Module({
  providers: [SprintCompleteWorkspaceService, SprintCompleteResolver],
})
export class SprintModule {}

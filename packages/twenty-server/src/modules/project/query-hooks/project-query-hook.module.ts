import { Module } from '@nestjs/common';

import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { ViewFilterModule } from 'src/engine/metadata-modules/view-filter/view-filter.module';
import { ViewGroupModule } from 'src/engine/metadata-modules/view-group/view-group.module';
import { ViewModule } from 'src/engine/metadata-modules/view/view.module';
import { ProjectCreateOnePostQueryHook } from 'src/modules/project/query-hooks/project-create-one.post-query.hook';
import { ProjectCreateOnePreQueryHook } from 'src/modules/project/query-hooks/project-create-one.pre-query.hook';
import { ProjectPostQueryHookService } from 'src/modules/project/query-hooks/project-post-query-hook.service';
import { ProjectUpdateOnePreQueryHook } from 'src/modules/project/query-hooks/project-update-one.pre-query.hook';

@Module({
  imports: [
    ViewModule,
    ViewFilterModule,
    ViewGroupModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
  ],
  providers: [
    ProjectCreateOnePreQueryHook,
    ProjectUpdateOnePreQueryHook,
    ProjectCreateOnePostQueryHook,
    ProjectPostQueryHookService,
  ],
  exports: [ProjectPostQueryHookService],
})
export class ProjectQueryHookModule {}

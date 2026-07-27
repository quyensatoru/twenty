import { Module } from '@nestjs/common';

import { ProjectCreateOnePreQueryHook } from 'src/modules/project/query-hooks/project-create-one.pre-query.hook';
import { ProjectUpdateOnePreQueryHook } from 'src/modules/project/query-hooks/project-update-one.pre-query.hook';

@Module({
  providers: [ProjectCreateOnePreQueryHook, ProjectUpdateOnePreQueryHook],
})
export class ProjectQueryHookModule {}

import { Module } from '@nestjs/common';

import { ShiftAttendanceResolver } from 'src/modules/shift/resolvers/shift-attendance.resolver';
import { ShiftHandoverResolver } from 'src/modules/shift/resolvers/shift-handover.resolver';
import { ShiftRosterResolver } from 'src/modules/shift/resolvers/shift-roster.resolver';
import { ShiftAttendanceWorkspaceService } from 'src/modules/shift/workspace-services/shift-attendance.workspace-service';
import { ShiftHandoverWorkspaceService } from 'src/modules/shift/workspace-services/shift-handover.workspace-service';
import { ShiftRosterWorkspaceService } from 'src/modules/shift/workspace-services/shift-roster.workspace-service';

@Module({
  providers: [
    ShiftAttendanceWorkspaceService,
    ShiftAttendanceResolver,
    ShiftRosterWorkspaceService,
    ShiftRosterResolver,
    ShiftHandoverWorkspaceService,
    ShiftHandoverResolver,
  ],
})
export class ShiftModule {}

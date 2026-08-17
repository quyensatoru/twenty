import { Injectable } from '@nestjs/common';

import { Between, In, Not } from 'typeorm';
import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type ShiftRosterEntryDTO } from 'src/modules/shift/dtos/shift-roster-entry.dto';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

// Team roster read for the Register page. The `shift` object is otherwise
// read-scoped per-member by a Record Visibility Policy (a member only reads their
// OWN shifts); this service intentionally BYPASSES that scope so coverage is
// team-visible — like the shared roster sheet it replaces. The bypass is safe
// because ONLY non-sensitive coverage fields ever reach the DTO: no attendance
// (checkInAt/checkOutAt/checkInLateMinutes/workingMinutes/handoverNote), no cancel
// detail (cancelReason/cancelCategory), no pay (rateMultiplier). Those fields are
// neither selected from the DB nor emitted.
@Injectable()
export class ShiftRosterWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  // `fromDate`/`toDate` are ICT calendar days ('YYYY-MM-DD'). The column is TEXT,
  // so a lexicographic Between is a valid inclusive date-range compare.
  async getRoster(
    authContext: WorkspaceAuthContext,
    fromDate: string,
    toDate: string,
  ): Promise<ShiftRosterEntryDTO[]> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const shiftRepository =
          await this.globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
            workspace.id,
            'shift',
            { shouldBypassPermissionChecks: true },
          );

        // SAFE FIELDS ONLY: the select list is the security boundary — sensitive
        // attendance/cancel/pay columns are never read out of the database here.
        const shifts = await shiftRepository.find({
          where: {
            date: Between(fromDate, toDate),
            status: Not('CANCELLED'),
          },
          select: [
            'id',
            'date',
            'status',
            'templateCode',
            'templateName',
            'startTime',
            'endTime',
            'shiftTemplateId',
            'memberId',
          ],
          order: { date: 'ASC', startTime: 'ASC' },
        });

        const memberNameById = await this.loadMemberNames(
          workspace.id,
          shifts
            .map((shift) => shift.memberId)
            .filter((memberId): memberId is string => isDefined(memberId)),
        );

        return shifts.map((shift) => ({
          id: shift.id,
          date: shift.date,
          status: shift.status,
          templateCode: shift.templateCode,
          templateName: shift.templateName,
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftTemplateId: shift.shiftTemplateId,
          memberId: shift.memberId,
          memberName: isDefined(shift.memberId)
            ? (memberNameById.get(shift.memberId) ?? null)
            : null,
        }));
      },
      authContext,
    );
  }

  // Resolve each distinct memberId to a "FirstName LastName" display string from
  // the workspaceMember's composite `name` (FullNameMetadata). Both parts empty →
  // null. No other member field is read.
  private async loadMemberNames(
    workspaceId: string,
    memberIds: string[],
  ): Promise<Map<string, string | null>> {
    const memberNameById = new Map<string, string | null>();

    const distinctMemberIds = [...new Set(memberIds)];

    if (distinctMemberIds.length === 0) {
      return memberNameById;
    }

    const workspaceMemberRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
        workspaceId,
        'workspaceMember',
        { shouldBypassPermissionChecks: true },
      );

    const members = await workspaceMemberRepository.find({
      where: { id: In(distinctMemberIds) },
    });

    for (const member of members) {
      const firstName = member.name?.firstName?.trim() ?? '';
      const lastName = member.name?.lastName?.trim() ?? '';
      const fullName = [firstName, lastName]
        .filter((part) => part.length > 0)
        .join(' ');

      memberNameById.set(member.id, fullName.length > 0 ? fullName : null);
    }

    return memberNameById;
  }
}

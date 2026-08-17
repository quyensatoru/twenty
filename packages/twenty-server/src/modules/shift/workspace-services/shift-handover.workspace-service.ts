import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { Between, In } from 'typeorm';
import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type ShiftHandoverEntryDTO } from 'src/modules/shift/dtos/shift-handover-entry.dto';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

// Team handover-note read for the My Week page: the person starting a shift reads
// what the person on the preceding shift handed over. The `shift` object is
// otherwise read-scoped per-member by a Record Visibility Policy; this service
// intentionally BYPASSES that scope so a handover note reaches the next member
// even when a DIFFERENT member wrote it. BR-4.6 makes the handover note
// team-readable, so exposing it here is by design — but the exposure is narrow:
// ONLY handoverNote plus the minimal identity to label it (date/time/template/
// member name) is selected. No attendance, cancel, or pay field is ever read.
@Injectable()
export class ShiftHandoverWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  // `fromDate`/`toDate` are ICT calendar days ('YYYY-MM-DD'). The column is TEXT,
  // so a lexicographic Between is a valid inclusive date-range compare. Only
  // COMPLETED shifts carry a final handover note.
  async getHandovers(
    authContext: WorkspaceAuthContext,
    fromDate: string,
    toDate: string,
  ): Promise<ShiftHandoverEntryDTO[]> {
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

        // SAFE SELECT: handoverNote is the one sensitive-adjacent field this query
        // exposes (team-readable per BR-4.6); every attendance/cancel/pay column
        // stays out of the select list.
        const shifts = await shiftRepository.find({
          where: {
            date: Between(fromDate, toDate),
            status: 'COMPLETED',
          },
          select: [
            'id',
            'date',
            'startTime',
            'endTime',
            'templateCode',
            'templateName',
            'memberId',
            'handoverNote',
          ],
          order: { date: 'ASC', startTime: 'ASC' },
        });

        // Only shifts that actually carry a note are handovers worth returning.
        const withNote = shifts.filter((shift) =>
          isNonEmptyString(shift.handoverNote),
        );

        const memberNameById = await this.loadMemberNames(
          workspace.id,
          withNote
            .map((shift) => shift.memberId)
            .filter((memberId): memberId is string => isDefined(memberId)),
        );

        return withNote.map((shift) => ({
          id: shift.id,
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          templateCode: shift.templateCode,
          templateName: shift.templateName,
          memberName: isDefined(shift.memberId)
            ? (memberNameById.get(shift.memberId) ?? null)
            : null,
          // Non-null by the filter above; the DTO field is non-nullable.
          handoverNote: shift.handoverNote as string,
        }));
      },
      authContext,
    );
  }

  // Resolve each distinct memberId to a "FirstName LastName" display string from
  // the workspaceMember's composite `name`. Both parts empty → null. No other
  // member field is read. Mirrors ShiftRosterWorkspaceService.loadMemberNames.
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

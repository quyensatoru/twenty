import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type SpecialDayWorkspaceEntity } from 'src/modules/shift/standard-objects/special-day.workspace-entity';

@Injectable()
export class ShiftRateWorkspaceService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  // `date` is an ICT calendar day (YYYY-MM-DD). SPECIFIC days match by exact
  // date, YEARLY days by month/day; the highest matching multiplier wins.
  async getMultiplierForDate(
    authContext: WorkspaceAuthContext,
    date: string,
  ): Promise<number> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const specialDayRepository =
        this.workspaceOrmManager.getRepository<SpecialDayWorkspaceEntity>(
          'specialDay',
          { shouldBypassPermissionChecks: true },
        );

      const specialDays = await specialDayRepository.find({
        where: { isActive: true },
      });

      const [, monthPart, dayPart] = date.split('-').map(Number);

      const matchingSpecialDays = specialDays.filter((specialDay) =>
        specialDay.kind === 'SPECIFIC'
          ? specialDay.date === date
          : specialDay.month === monthPart && specialDay.day === dayPart,
      );

      return matchingSpecialDays.reduce(
        (highestMultiplier, specialDay) =>
          Math.max(highestMultiplier, specialDay.multiplier),
        1,
      );
    }, authContext);
  }
}

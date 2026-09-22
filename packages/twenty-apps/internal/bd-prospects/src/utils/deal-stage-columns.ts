import { UPSELL_DEAL_STAGE_OPTIONS } from '../constants/pipeline-stages';
import { SELLABLE_APPS } from '../constants/registered-apps';

import { toAppKey } from './app-key';

export type DealStageEntry = {
  targetApp: { name: string | null } | null;
  stage: string | null;
};

const STAGE_POSITION_BY_VALUE = new Map<string, number>(
  UPSELL_DEAL_STAGE_OPTIONS.map((stage) => [
    stage.value as string,
    stage.position,
  ]),
);

// One column per app the team sells, so BD reads "where is this shop on BLOY"
// without opening the deal. A shop can hold more than one deal for the same app
// (a rejected one and a fresh attempt), so the column shows the furthest along.
// A deal against an app we do not sell has no column: its stage still lives on
// the deal itself.
export const buildDealStageColumns = (
  deals: DealStageEntry[],
): Record<string, string | null> => {
  const stageByAppKey = new Map<string, string>();

  for (const deal of deals) {
    const appKey = toAppKey(deal.targetApp?.name ?? '');

    if (appKey === null || deal.stage === null) {
      continue;
    }

    const currentStage = stageByAppKey.get(appKey);

    if (
      currentStage === undefined ||
      stagePosition(deal.stage) > stagePosition(currentStage)
    ) {
      stageByAppKey.set(appKey, deal.stage);
    }
  }

  return Object.fromEntries(
    SELLABLE_APPS.map((app) => [
      app.stage.name,
      stageByAppKey.get(app.key) ?? null,
    ]),
  );
};

// An unknown stage sorts first so a known one always wins over it.
const stagePosition = (stage: string): number =>
  STAGE_POSITION_BY_VALUE.get(stage) ?? -1;

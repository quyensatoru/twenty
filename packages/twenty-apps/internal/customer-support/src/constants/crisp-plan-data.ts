// Keys written into every Crisp session's data, so the inbox's advanced
// filters can segment chats by plan. One pair per product: a website shared by
// two products holds chats of shops that use both, and each product's plan
// has to stay filterable on its own. Prefixed so they never collide with the
// keys each product's app sets itself.
export const getCrispPlanDataPlanKey = (appName: string): string =>
  `crm_${appName.toLowerCase()}_plan`;

export const getCrispPlanDataPlanStartedAtKey = (appName: string): string =>
  `crm_${appName.toLowerCase()}_plan_started_at`;

export const CRISP_PLAN_DATA_UNINSTALLED_PLAN = 'UNINSTALLED';

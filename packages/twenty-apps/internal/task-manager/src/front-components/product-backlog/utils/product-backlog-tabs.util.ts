export const PRODUCT_BACKLOG_TABS = [
  'list',
  'prioritize',
  'sprint',
  'ideas',
  'insights',
  'settings',
] as const;

export type ProductBacklogTab = (typeof PRODUCT_BACKLOG_TABS)[number];

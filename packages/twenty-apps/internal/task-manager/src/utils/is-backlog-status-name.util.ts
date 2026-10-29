import { BACKLOG_STATUS_NAME } from '../constants/product-backlog';

export const isBacklogStatusName = (name: string | null | undefined) =>
  name?.trim().toUpperCase() === BACKLOG_STATUS_NAME.toUpperCase();

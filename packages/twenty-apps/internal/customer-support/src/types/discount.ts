import {
  type DiscountScope,
  type DiscountSyncAction,
  type DiscountSyncResult,
  type DiscountSyncStatus,
  type DiscountType,
} from '../constants/discount';

export type AppErrorItem = {
  field: string | null;
  code: string | null;
  message: string;
};

export type DiscountListItem = {
  id: string;
  name: string | null;
  discountCode: string;
  discountType: DiscountType | null;
  discountValue: number | null;
  limitInIntervals: number | null;
  limitUsage: number | null;
  timesUsed: number | null;
  startDate: string | null;
  endDate: string | null;
  status: boolean;
  scope: DiscountScope | null;
  reason: string | null;
  assignedDomains: string[];
  appId: string | null;
  appName: string | null;
  merchantId: string | null;
  merchantName: string | null;
  syncStatus: DiscountSyncStatus | null;
  syncError: string | null;
  syncedAt: string | null;
  externalId: string | null;
  nextSyncAt: string | null;
  createdAt: string;
  createdByName: string | null;
};

export type DiscountAppOption = {
  id: string;
  name: string;
  isConnected: boolean;
};

export type DiscountListResult = {
  discounts: DiscountListItem[];
  apps: DiscountAppOption[];
  canEdit: boolean;
  canConfigure: boolean;
};

export type DiscountConnectionItem = {
  appId: string;
  appName: string;
  endpoint: string;
  hasSecret: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  discountCount: number;
};

export type DiscountConnectionsResult = {
  connections: DiscountConnectionItem[];
};

export type DiscountSyncLogItem = {
  id: string;
  appName: string | null;
  action: DiscountSyncAction | null;
  result: DiscountSyncResult | null;
  httpStatus: number | null;
  durationMs: number | null;
  errors: AppErrorItem[];
  response: unknown;
  triggeredBy: string | null;
  createdAt: string;
};

export type DiscountDetailResult = {
  discount: DiscountListItem;
  syncLogs: DiscountSyncLogItem[];
};

export type DiscountSaveResult = {
  discount: DiscountListItem;
};

export type MerchantOption = {
  id: string;
  name: string;
  appName: string | null;
};

export type MerchantSearchResult = {
  merchants: MerchantOption[];
};

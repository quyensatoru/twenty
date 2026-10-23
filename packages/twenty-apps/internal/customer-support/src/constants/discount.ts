export const DISCOUNT_SYNC_ENABLED_VARIABLE = 'DISCOUNT_SYNC_ENABLED';

// Where each app takes discounts: one entry per Task Manager `app` record in
// the app's key-value store, edited by admins on the Discounts page, so an app
// added later needs no new variable and no deploy.
export const getDiscountConnectionKey = (appId: string): string =>
  `discount-connection:${appId}`;

export const DISCOUNT_CONSOLE_LIST_ROUTE_PATH = '/customer-support/discounts/list';
export const DISCOUNT_CONSOLE_DETAIL_ROUTE_PATH =
  '/customer-support/discounts/detail';
export const DISCOUNT_CONSOLE_SAVE_ROUTE_PATH = '/customer-support/discounts/save';
export const DISCOUNT_CONSOLE_RESEND_ROUTE_PATH =
  '/customer-support/discounts/resend';
export const DISCOUNT_CONSOLE_DELETE_ROUTE_PATH =
  '/customer-support/discounts/delete';
export const DISCOUNT_CONSOLE_SEARCH_MERCHANTS_ROUTE_PATH =
  '/customer-support/discounts/search-merchants';
export const DISCOUNT_CONNECTIONS_ROUTE_PATH =
  '/customer-support/discounts/connections';
export const DISCOUNT_CONNECTION_SAVE_ROUTE_PATH =
  '/customer-support/discounts/connection-save';
// Called by the product servers, so this path is a contract with them.
export const DISCOUNT_SYNC_RESULT_ROUTE_PATH =
  '/customer-support/discounts/sync-result';

export const DISCOUNT_TYPES = ['PERCENTAGE', 'FIX_AMOUNT'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_SCOPES = ['SINGLE', 'MULTI', 'ALL'] as const;
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

export const DISCOUNT_SYNC_STATUSES = [
  'DRAFT',
  'PENDING',
  'APPLIED',
  'REJECTED',
  'FAILED',
  'NOT_CONNECTED',
] as const;
export type DiscountSyncStatus = (typeof DISCOUNT_SYNC_STATUSES)[number];

export const DISCOUNT_SYNC_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'] as const;
export type DiscountSyncAction = (typeof DISCOUNT_SYNC_ACTIONS)[number];

export const DISCOUNT_SYNC_RESULTS = [
  'APPLIED',
  'REJECTED',
  'ACCEPTED',
  'ERROR',
  'TIMEOUT',
  'NOT_CONNECTED',
] as const;
export type DiscountSyncResult = (typeof DISCOUNT_SYNC_RESULTS)[number];

// What the product servers read. A change to any of them is sent again; the
// sync bookkeeping and timesUsed (written back by the products) are not.
export const DISCOUNT_DISPATCH_FIELDS = [
  'name',
  'discountCode',
  'discountType',
  'discountValue',
  'startDate',
  'endDate',
  'limitInIntervals',
  'limitUsage',
  'status',
  'scope',
  'reason',
  'assignedDomains',
  'appId',
  'merchantId',
] as const;

// Seen in existing records as 99999 and 9999999; anything this large means
// the discount never runs out of billing cycles.
export const FOREVER_INTERVALS = 9999;

export const DISCOUNT_RETRY_DELAYS_MINUTES = [1, 5, 30, 120] as const;

export const DISCOUNT_REQUEST_TIMEOUT_MS = 10_000;

export const DISCOUNT_TYPE_OPTIONS = [
  {
    id: '19e4aeab-beb4-490b-a6db-cd90ed1910e3',
    value: 'PERCENTAGE',
    label: 'Percentage',
    position: 0,
    color: 'green',
  },
  {
    id: 'da4d3cf9-6c31-4c01-a0f6-d426939f9d31',
    value: 'FIX_AMOUNT',
    label: 'Fixed amount',
    position: 1,
    color: 'turquoise',
  },
] as const;

export const DISCOUNT_SCOPE_OPTIONS = [
  {
    id: 'ebadc867-a807-41c5-a9a0-b236e6957a39',
    value: 'ALL',
    label: 'All shops',
    position: 0,
    color: 'green',
  },
  {
    id: 'ae27de3f-4fbf-42a1-a3bd-616cc71833f8',
    value: 'MULTI',
    label: 'Listed shops',
    position: 1,
    color: 'turquoise',
  },
  {
    id: 'eefc219b-c072-4010-8c23-47c917bf12ce',
    value: 'SINGLE',
    label: 'One merchant',
    position: 2,
    color: 'sky',
  },
] as const;

export const DISCOUNT_SYNC_STATUS_OPTIONS = [
  {
    id: '742afed5-f367-4a06-913e-5ba1aa571c4f',
    value: 'DRAFT',
    label: 'Draft',
    position: 0,
    color: 'gray',
  },
  {
    id: '7fc1cff6-97d5-4aff-bcdb-ff3982d3d19d',
    value: 'PENDING',
    label: 'Sending',
    position: 1,
    color: 'yellow',
  },
  {
    id: 'dec1d2cc-ee17-4943-8c6c-cf23e110a7e5',
    value: 'APPLIED',
    label: 'Applied',
    position: 2,
    color: 'green',
  },
  {
    id: 'a3f1c3e2-5b0c-4d8e-9f5a-1c2b3d4e5f60',
    value: 'REJECTED',
    label: 'Rejected',
    position: 3,
    color: 'red',
  },
  {
    id: 'b4e2d4f3-6c1d-4e9f-8a6b-2d3c4e5f6a71',
    value: 'FAILED',
    label: 'Delivery failed',
    position: 4,
    color: 'orange',
  },
  {
    id: 'c5f3e5a4-7d2e-4fa0-9b7c-3e4d5f6a7b82',
    value: 'NOT_CONNECTED',
    label: 'Not connected',
    position: 5,
    color: 'gray',
  },
] as const;

export const DISCOUNT_SYNC_ACTION_OPTIONS = [
  {
    id: 'd6a4f6b5-8e3f-4ab1-8c8d-4f5e6a7b8c93',
    value: 'CREATE',
    label: 'Create',
    position: 0,
    color: 'green',
  },
  {
    id: 'e7b5a7c6-9f4a-4bc2-9d9e-5a6f7b8c9da4',
    value: 'UPDATE',
    label: 'Update',
    position: 1,
    color: 'blue',
  },
  {
    id: 'f8c6b8d7-a05b-4cd3-8eaf-6b7a8c9daeb5',
    value: 'DELETE',
    label: 'Delete',
    position: 2,
    color: 'red',
  },
] as const;

export const DISCOUNT_SYNC_RESULT_OPTIONS = [
  {
    id: '09d7c9e8-b16c-4de4-9fb0-7c8b9daebfc6',
    value: 'APPLIED',
    label: 'Applied',
    position: 0,
    color: 'green',
  },
  {
    id: '1ae8daf9-c27d-4ef5-80c1-8d9caebfc0d7',
    value: 'REJECTED',
    label: 'Rejected',
    position: 1,
    color: 'red',
  },
  {
    id: '2bf9eb0a-d38e-4f06-91d2-9eadbfc0d1e8',
    value: 'ACCEPTED',
    label: 'Accepted (answer later)',
    position: 2,
    color: 'yellow',
  },
  {
    id: '3c0afc1b-e49f-4017-a2e3-afbec0d1e2f9',
    value: 'ERROR',
    label: 'Error',
    position: 3,
    color: 'orange',
  },
  {
    id: '4d1b0d2c-f5a0-4128-b3f4-b0cfd1e2f30a',
    value: 'TIMEOUT',
    label: 'Timeout',
    position: 4,
    color: 'orange',
  },
  {
    id: '5e2c1e3d-06b1-4239-8405-c1d0e2f3041b',
    value: 'NOT_CONNECTED',
    label: 'Not connected',
    position: 5,
    color: 'gray',
  },
] as const;

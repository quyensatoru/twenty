// App routes are served under `/s`; the REST client prefixes it.
export const CONTEXT_ROUTE_PATH = '/bc-workspace/context';
export const CLIENT_LIST_ROUTE_PATH = '/bc-workspace/clients/list';
export const CLIENT_DETAIL_ROUTE_PATH = '/bc-workspace/clients/detail';
export const CLIENT_SAVE_ROUTE_PATH = '/bc-workspace/clients/save';
export const CLIENT_SEARCH_ROUTE_PATH = '/bc-workspace/clients/search';
export const MERCHANT_SEARCH_ROUTE_PATH = '/bc-workspace/merchants/search';
export const ACTIVITY_LOG_ROUTE_PATH = '/bc-workspace/activities/log';
export const ISSUE_CREATE_ROUTE_PATH = '/bc-workspace/issues/create';
export const ISSUE_RESOLVE_ROUTE_PATH = '/bc-workspace/issues/resolve';
export const ISSUE_DISMISS_ROUTE_PATH = '/bc-workspace/issues/dismiss';
export const DEV_TASK_PROJECTS_ROUTE_PATH = '/bc-workspace/dev-task/projects';
export const DEV_TASK_LINK_ROUTE_PATH = '/bc-workspace/dev-task/link';
export const TASK_LIST_ROUTE_PATH = '/bc-workspace/tasks/list';
export const TASK_SAVE_ROUTE_PATH = '/bc-workspace/tasks/save';
export const TASK_DETAIL_ROUTE_PATH = '/bc-workspace/tasks/detail';
export const ANALYTICS_ROUTE_PATH = '/bc-workspace/analytics';
export const ANALYTICS_DRILLDOWN_ROUTE_PATH = '/bc-workspace/analytics/drilldown';
export const REVIEW_SAVE_ROUTE_PATH = '/bc-workspace/reviews/save';
export const SETTINGS_ROUTE_PATH = '/bc-workspace/settings';
export const SETTINGS_SAVE_ROUTE_PATH = '/bc-workspace/settings/save';

// Called by the billing, usage and review systems with the ingest secret.
export const INGEST_USAGE_ROUTE_PATH = '/bc-workspace/ingest/usage';
export const INGEST_REVIEW_ROUTE_PATH = '/bc-workspace/ingest/review';
export const INGEST_PAYMENT_ROUTE_PATH = '/bc-workspace/ingest/payment';
export const INGEST_SUBSCRIPTION_ROUTE_PATH = '/bc-workspace/ingest/subscription';
export const INGEST_MEETING_ROUTE_PATH = '/bc-workspace/ingest/meeting';

// Owned by Task Manager: BC Workspace opens developer tasks through it so its
// key allocation, merchant links and notifications all apply.
export const TASK_MANAGER_CREATE_ISSUE_ROUTE_PATH = '/task-manager/create-issue';

// The generated client types only exist after `twenty dev:generate-client` has
// run against a workspace where the app is installed, so every query result is
// described here instead and passed as an explicit type argument at the call
// site.
export type Connection<TNode> = {
  edges: { node: TNode }[];
  pageInfo: { hasNextPage: boolean; endCursor: string };
};

export type MerchantRow = {
  id: string;
  name: string | null;
  appId: string | null;
  shopifyPlan: string | null;
  prospectId: string | null;
  // False once the shop removes the app. The apps keep the row and flip this
  // flag rather than deleting it, so it is the only reliable install state.
  // Null on a workspace whose sync has never written it, which counts as
  // installed.
  using?: boolean | null;
  email?: { primaryEmail: string | null } | null;
};

export type ProspectRow = {
  id: string;
  domain: string | null;
  shopifyPlan: string | null;
  ourApps: string[] | null;
  otherApps: string[] | null;
  email?: { primaryEmail: string | null } | null;
  // Set the first time the merchant sync touches a prospect. Distinguishes a
  // shop whose merchant rows have all gone from one that only ever came from a
  // CSV and never had any.
  lastSyncedAt: string | null;
};

export type AppRow = {
  id: string;
  name: string | null;
};

export type UpsellDealRow = {
  id: string;
  stage: string | null;
  suggestedClose?: boolean | null;
  targetApp: { id: string; name: string | null } | null;
};

export type MetadataObjectRow = {
  id: string;
  nameSingular: string;
  fields: Connection<{ id: string; name: string }>;
};

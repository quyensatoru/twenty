export type BroadcastBatchPayload = {
  campaignId: string;
  runId: string;
  pageIndex: number;
  // Fixed by the first page so a mid-run variable change cannot shift the
  // manual list slices.
  pageSize?: number;
  after?: string;
};

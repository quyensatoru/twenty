export type BroadcastBatchPayload = {
  campaignId: string;
  runId: string;
  pageIndex: number;
  after?: string;
};

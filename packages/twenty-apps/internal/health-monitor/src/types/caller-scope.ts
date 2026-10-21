export type CallerScope = {
  workspaceMemberId: string | null;
  canBypassAppScope: boolean;
  readableAppIds: Set<string>;
  writableAppIds: Set<string>;
};

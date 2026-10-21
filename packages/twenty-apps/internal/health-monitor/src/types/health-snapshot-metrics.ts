export type HealthProcessSnapshot = {
  name: string;
  pm2Id: number | null;
  status: string;
  cpuPercent: number | null;
  memoryMegabytes: number | null;
  restarts: number | null;
  uptimeSeconds: number | null;
};

export type HealthNodeSnapshot = {
  key: string;
  host: string | null;
  status: string;
  cpuPercent: number | null;
  memoryPercent: number | null;
  memoryUsedMegabytes: number | null;
  memoryTotalMegabytes: number | null;
  diskPercent: number | null;
  diskUsedGigabytes: number | null;
  diskTotalGigabytes: number | null;
  uptimeSeconds: number | null;
  processes: HealthProcessSnapshot[];
};

export type HealthSnapshotMetrics = {
  version: 1;
  nodes: HealthNodeSnapshot[];
};

const node = (
  host: string,
  cpu: number,
  memory: number,
  disk: number,
  services: unknown[],
) => ({
  status: 'ok',
  host,
  uptimeSec: 57_488.8,
  system: {
    cpuUsagePercent: cpu,
    memory: { usedMB: 5779.8, totalMB: 15970.9, usagePercent: memory },
    disk: { usedGB: 54.6, totalGB: 307, usagePercent: disk, mount: '/' },
  },
  services,
});

const process = (
  name: string,
  pm2Id: number,
  restarts: number,
  memoryMB = 80,
  status = 'online',
) => ({
  name,
  pm2Id,
  status,
  cpuPercent: 0.3,
  memoryMB,
  uptimeSec: 57_489,
  restarts,
});

export const buildHealthPayload = ({
  hmCpu = 82.86,
  apiRestarts = 9,
  hmStatus = 'ok',
  pingProcessStatus = 'online',
  withoutPingShard2 = false,
}: {
  hmCpu?: number;
  apiRestarts?: number;
  hmStatus?: string;
  pingProcessStatus?: string;
  withoutPingShard2?: boolean;
} = {}) => ({
  ...node('10.0.0.1', 29.55, 45.16, 9.6, [
    process('proxy', 0, 0),
    process('server', 2, 0),
    process('server', 3, 0),
  ]),
  service: 'proxy',
  downstream: {
    api: {
      shard1: node('10.0.1.1', 23.42, 36.19, 17.78, [
        process('mida-api', 0, apiRestarts),
        process('event.cluster', 1, apiRestarts, 415),
        process('event.cluster', 2, apiRestarts, 411),
      ]),
    },
    hm: {
      shard1: {
        ...node('10.0.2.1', hmCpu, 86.66, 69.76, [
          process('mida-hm', 2, 29, 42),
        ]),
        status: hmStatus,
      },
    },
    ping: {
      shard1: node('10.0.3.1', 51.35, 77.31, 56.41, [
        process('mida-ping', 0, 6, 366, pingProcessStatus),
      ]),
      ...(withoutPingShard2
        ? {}
        : {
            shard2: node('10.0.3.2', 56.41, 67.71, 21.35, [
              process('mida-ping', 0, 0, 289),
            ]),
          }),
    },
  },
});

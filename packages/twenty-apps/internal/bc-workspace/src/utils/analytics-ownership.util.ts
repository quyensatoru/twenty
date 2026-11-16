import {
  type BcActivityRecord,
  type VipClientRecord,
} from '../types/bc-records';

export type OwnershipSpan = {
  memberId: string | null;
  // Inclusive start, exclusive end, epoch ms; -Infinity / Infinity when open.
  from: number;
  to: number;
};

export type OwnershipIndex = {
  ownerAt: (vipClientId: string | null, instant: number) => string | null;
  ownedDuring: (
    vipClientId: string,
    memberIds: string[] | null,
    from: number,
    to: number,
  ) => boolean;
  spansOf: (vipClientId: string) => OwnershipSpan[];
};

const readTime = (value: string | null | undefined): number =>
  typeof value === 'string' && value.length > 0
    ? Date.parse(value)
    : Number.NaN;

const readMember = (
  metadata: Record<string, unknown> | null,
  key: string,
): string | null => {
  const value = metadata?.[key];

  return typeof value === 'string' && value.length > 0 ? value : null;
};

// Who owned a client when: rebuilt from the PIC_CHANGE log so a reassignment
// never rewrites a past period. Without any logged change the current PIC
// owns the client from its assignment on.
export const buildOwnershipSpans = (
  client: Pick<VipClientRecord, 'picId' | 'assignedAt' | 'createdAt'>,
  picChanges: BcActivityRecord[],
): OwnershipSpan[] => {
  const changes = picChanges
    .filter((change) => !Number.isNaN(readTime(change.occurredAt)))
    .sort(
      (left, right) => readTime(left.occurredAt) - readTime(right.occurredAt),
    );

  if (changes.length === 0) {
    const assignedAt = readTime(client.assignedAt ?? client.createdAt);

    return [
      {
        memberId: client.picId,
        from: Number.isNaN(assignedAt) ? Number.NEGATIVE_INFINITY : assignedAt,
        to: Number.POSITIVE_INFINITY,
      },
    ];
  }

  const spans: OwnershipSpan[] = [];
  const firstFrom = readMember(changes[0].metadata, 'fromMemberId');

  if (firstFrom !== null) {
    spans.push({
      memberId: firstFrom,
      from: Number.NEGATIVE_INFINITY,
      to: readTime(changes[0].occurredAt),
    });
  }

  changes.forEach((change, index) => {
    const next = changes[index + 1];

    spans.push({
      memberId: readMember(change.metadata, 'toMemberId'),
      from: readTime(change.occurredAt),
      to:
        next === undefined
          ? Number.POSITIVE_INFINITY
          : readTime(next.occurredAt),
    });
  });

  // A PIC change the log missed: the current PIC owns from its assignment.
  const last = spans[spans.length - 1];

  if (last.memberId !== client.picId) {
    const assignedAt = readTime(client.assignedAt);
    const from =
      Number.isNaN(assignedAt) || assignedAt < last.from
        ? last.from
        : assignedAt;

    if (from > last.from) {
      last.to = from;
      spans.push({
        memberId: client.picId,
        from,
        to: Number.POSITIVE_INFINITY,
      });
    } else {
      last.memberId = client.picId;
    }
  }

  return spans.filter((span) => span.to > span.from);
};

export const buildOwnershipIndex = (
  clients: VipClientRecord[],
  activities: BcActivityRecord[],
): OwnershipIndex => {
  const changesByClient = new Map<string, BcActivityRecord[]>();

  for (const activity of activities) {
    if (
      activity.activityType !== 'PIC_CHANGE' ||
      activity.vipClientId === null
    ) {
      continue;
    }

    changesByClient.set(activity.vipClientId, [
      ...(changesByClient.get(activity.vipClientId) ?? []),
      activity,
    ]);
  }

  const spansByClient = new Map(
    clients.map((client) => [
      client.id,
      buildOwnershipSpans(client, changesByClient.get(client.id) ?? []),
    ]),
  );

  const spansOf = (vipClientId: string): OwnershipSpan[] =>
    spansByClient.get(vipClientId) ?? [];

  return {
    spansOf,
    ownerAt: (vipClientId, instant) => {
      if (vipClientId === null || Number.isNaN(instant)) {
        return null;
      }

      return (
        spansOf(vipClientId).find(
          (span) => span.from <= instant && instant < span.to,
        )?.memberId ?? null
      );
    },
    ownedDuring: (vipClientId, memberIds, from, to) =>
      spansOf(vipClientId).some(
        (span) =>
          span.memberId !== null &&
          (memberIds === null || memberIds.includes(span.memberId)) &&
          span.from < to &&
          span.to > from,
      ),
  };
};

// Clients the members owned at some point before `end`, per the PIC log;
// they stay in the member's past figures after moving to another team.
export const readFormerlyOwnedClientIds = (
  picChanges: BcActivityRecord[],
  memberIds: string[] | null,
): string[] => {
  if (memberIds === null) {
    return [];
  }

  return [
    ...new Set(
      picChanges.flatMap((change) => {
        const from = readMember(change.metadata, 'fromMemberId');
        const to = readMember(change.metadata, 'toMemberId');

        return change.vipClientId !== null &&
          ((from !== null && memberIds.includes(from)) ||
            (to !== null && memberIds.includes(to)))
          ? [change.vipClientId]
          : [];
      }),
    ),
  ];
};

// Relationship status as of an instant, replayed from the STATUS_CHANGE log;
// falls back to the current status when nothing was logged before then.
export const readStatusAt = (
  client: Pick<VipClientRecord, 'id' | 'relationshipStatus'>,
  statusChanges: BcActivityRecord[],
  instant: number,
): string => {
  const before = statusChanges
    .filter(
      (change) =>
        change.vipClientId === client.id &&
        readTime(change.occurredAt) < instant,
    )
    .sort(
      (left, right) => readTime(left.occurredAt) - readTime(right.occurredAt),
    );
  const last = before[before.length - 1];
  const after = statusChanges.some(
    (change) =>
      change.vipClientId === client.id &&
      readTime(change.occurredAt) >= instant,
  );

  if (last !== undefined) {
    return readMember(last.metadata, 'to') ?? client.relationshipStatus;
  }

  if (after) {
    const first = statusChanges
      .filter((change) => change.vipClientId === client.id)
      .sort(
        (left, right) => readTime(left.occurredAt) - readTime(right.occurredAt),
      )[0];

    return (
      readMember(first?.metadata ?? null, 'from') ?? client.relationshipStatus
    );
  }

  return client.relationshipStatus;
};

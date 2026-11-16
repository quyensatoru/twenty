// Words that make a BC message about the plan rather than general support,
// English and Vietnamese. Matching is deliberately simple: it only decides
// whether a contact can count toward upgrade credit, and the threshold usage
// alert or an UPSELL topic set by the BC still counts without it.
const UPSELL_KEYWORDS = [
  'upgrade',
  'upgrading',
  'plan',
  'pricing',
  'limit',
  'usage',
  'allowance',
  'quota',
  'nâng cấp',
  'gói',
  'hạn mức',
  'giới hạn',
];

const normalize = (text: string): string =>
  text.toLowerCase().normalize('NFC').replace(/\s+/g, ' ');

export const mentionsUpsell = (text: string | null | undefined): boolean => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return false;
  }

  const normalized = normalize(text);

  return UPSELL_KEYWORDS.some((keyword) => {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}])${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`,
      'u',
    );

    return pattern.test(normalized);
  });
};

type OpportunityCandidate = {
  id: string;
  appName: string | null;
  status: string;
  billingCycle: string | null;
  createdAt: string;
};

// The opportunity a verified upgrade converts: still open, same app, raised
// before the change; the newest billing cycle wins, then the newest record.
export const pickOpportunityToConvert = <TOpportunity extends OpportunityCandidate>(
  opportunities: TOpportunity[],
  appName: string | null,
  changedAt: string,
): TOpportunity | null => {
  const changedTime = Date.parse(changedAt);
  const candidates = opportunities.filter(
    (opportunity) =>
      opportunity.status === 'OPEN' &&
      (appName === null ||
        (opportunity.appName ?? '').toUpperCase() === appName.toUpperCase()) &&
      Date.parse(opportunity.createdAt) <= changedTime,
  );

  return (
    [...candidates].sort(
      (left, right) =>
        (right.billingCycle ?? '').localeCompare(left.billingCycle ?? '') ||
        Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
        right.id.localeCompare(left.id),
    )[0] ?? null
  );
};

// A usage reading older than the one stored, or the same event delivered
// twice, must not move thresholds back or log again.
export const isStaleUsageEvent = ({
  previous,
  at,
  eventId,
}: {
  previous: { at: string; eventId?: string | null } | null | undefined;
  at: string;
  eventId: string | null;
}): boolean => {
  if (previous === null || previous === undefined) {
    return false;
  }

  if (eventId !== null && previous.eventId === eventId) {
    return true;
  }

  return Date.parse(previous.at) > Date.parse(at);
};

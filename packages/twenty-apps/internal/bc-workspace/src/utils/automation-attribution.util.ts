import { type BcActivityRecord } from '../types/bc-records';
import { mentionsUpsell } from './automation-upsell.util';

const DAY_MS = 86_400_000;

export type AttributionActivity = Pick<
  BcActivityRecord,
  | 'id'
  | 'title'
  | 'summary'
  | 'activityType'
  | 'direction'
  | 'topic'
  | 'meetingStatus'
  | 'isBcAuthored'
  | 'actorMemberId'
  | 'occurredAt'
  | 'appName'
>;

export type AttributionDecision = {
  isBcInfluenced: boolean;
  attributedMemberId: string | null;
  activityIds: string[];
  reason: string;
};

const sameApp = (activityApp: string | null, appName: string | null): boolean =>
  activityApp === null ||
  appName === null ||
  activityApp.toUpperCase() === appName.toUpperCase();

// A real conversation with the client: a CS reply, a system event or a
// booked-but-not-held meeting is not outreach.
export const isQualifyingContact = (activity: AttributionActivity): boolean => {
  if (!activity.isBcAuthored || activity.actorMemberId === null) {
    return false;
  }

  switch (activity.activityType) {
    case 'CRISP_MESSAGE':
      return activity.direction === 'OUTBOUND';
    case 'EMAIL':
    case 'CALL':
    case 'REVIEW_REQUEST':
      return true;
    case 'MEETING':
      return activity.meetingStatus === 'COMPLETED';
    default:
      return false;
  }
};

const isWithinWindow = (
  occurredAt: string | null,
  eventAt: string,
  windowDays: number,
): occurredAt is string => {
  if (occurredAt === null) {
    return false;
  }

  const occurred = Date.parse(occurredAt);
  const event = Date.parse(eventAt);

  return occurred < event && occurred >= event - windowDays * DAY_MS;
};

const pickLatest = (
  activities: AttributionActivity[],
): AttributionActivity | undefined =>
  [...activities].sort(
    (left, right) =>
      Date.parse(right.occurredAt ?? '') - Date.parse(left.occurredAt ?? ''),
  )[0];

// Credit only for outreach that happened before the plan changed: a contact
// on the UPSELL topic (a completed meeting included), or, once an open
// opportunity for the app existed, a contact that talks about the plan. The
// credit goes to whoever reached out, not to the current PIC.
export const decideUpgradeAttribution = ({
  activities,
  openOpportunityCreatedAts,
  appName,
  changedAt,
  windowDays,
}: {
  activities: AttributionActivity[];
  openOpportunityCreatedAts: string[];
  appName: string | null;
  changedAt: string;
  windowDays: number;
}): AttributionDecision => {
  const earliestOpportunity = openOpportunityCreatedAts
    .map((createdAt) => Date.parse(createdAt))
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => left - right)[0];

  const qualifying = activities.filter(
    (activity) =>
      activity.activityType !== 'REVIEW_REQUEST' &&
      isQualifyingContact(activity) &&
      sameApp(activity.appName, appName) &&
      isWithinWindow(activity.occurredAt, changedAt, windowDays) &&
      (activity.topic === 'UPSELL' ||
        (earliestOpportunity !== undefined &&
          Date.parse(activity.occurredAt ?? '') >= earliestOpportunity &&
          mentionsUpsell(`${activity.title ?? ''} ${activity.summary ?? ''}`))),
  );
  const latest = pickLatest(qualifying);

  if (latest === undefined) {
    return {
      isBcInfluenced: false,
      attributedMemberId: null,
      activityIds: [],
      reason: 'No BC upsell outreach before the upgrade',
    };
  }

  return {
    isBcInfluenced: true,
    attributedMemberId: latest.actorMemberId,
    activityIds: qualifying.map((activity) => activity.id),
    reason: 'BC upsell outreach before the upgrade',
  };
};

export const decideReviewAttribution = ({
  activities,
  appName,
  publishedAt,
  windowDays,
}: {
  activities: AttributionActivity[];
  appName: string | null;
  publishedAt: string;
  windowDays: number;
}): AttributionDecision => {
  const qualifying = activities.filter(
    (activity) =>
      isQualifyingContact(activity) &&
      (activity.activityType === 'REVIEW_REQUEST' || activity.topic === 'REVIEW') &&
      sameApp(activity.appName, appName) &&
      isWithinWindow(activity.occurredAt, publishedAt, windowDays),
  );
  const latest = pickLatest(qualifying);

  return latest === undefined
    ? {
        isBcInfluenced: false,
        attributedMemberId: null,
        activityIds: [],
        reason: 'No BC review request before publication',
      }
    : {
        isBcInfluenced: true,
        attributedMemberId: latest.actorMemberId,
        activityIds: [latest.id],
        reason: 'BC review request before publication',
      };
};

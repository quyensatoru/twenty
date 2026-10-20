export type MemberGender = 'FEMALE' | 'MALE' | 'UNSPECIFIED';

export type EventAudience = 'EVERYONE' | 'WOMEN' | 'MEN';

export type MemberProfileRow = {
  id: string;
  memberId: string;
  displayName: string;
  birthday: string | null;
  joinedAt: string | null;
  hideBirthYear: boolean;
  gender: MemberGender | null;
};

export type TeamEventRow = {
  id: string;
  name: string;
  kind: 'HOLIDAY' | 'CUSTOM';
  date: string;
  isYearly: boolean;
  startTime: string | null;
  location: string | null;
  description: string | null;
  organizerId: string | null;
  audience: EventAudience | null;
};

export type EventMessageRow = {
  id: string;
  occurrenceKey: string;
  body: string;
  authorId: string | null;
  heartMemberIds: string[] | null;
  media: MessageAttachment[] | null;
  createdAt: string;
};

export type CardSignature = {
  memberId: string;
  name: string;
  note: string;
  signedAt: string;
};

export type EventCardRow = {
  id: string;
  occurrenceKey: string;
  eventTitle: string;
  eventDate: string | null;
  cardKind: 'GREETING' | 'INVITATION';
  templateKey: string;
  recipient: string | null;
  message: string | null;
  signatures: CardSignature[] | null;
  shareToken: string | null;
  backgroundImage?: { fileId: string; label: string; url?: string | null }[] | null;
  thumbnail?: { fileId: string; label: string; url?: string | null }[] | null;
};

export type MemberSummary = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

export type MessageAttachment = {
  fileId: string;
  label: string;
  extension?: string | null;
  url?: string | null;
};

export type RsvpStatus = 'GOING' | 'MAYBE' | 'NO';

export type GiftContribution = {
  memberId: string;
  name: string;
  amount: number;
  contributedAt: string;
};

export type OccasionPlanRow = {
  id: string;
  occurrenceKey: string;
  rsvps: Record<string, RsvpStatus> | null;
  giftGoal: number | null;
  giftIdea: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  contributions: GiftContribution[] | null;
  organizerId: string | null;
};

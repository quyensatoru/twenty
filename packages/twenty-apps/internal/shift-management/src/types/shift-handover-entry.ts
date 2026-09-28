// Handover projection of a COMPLETED shift: the operational note plus the
// minimal identity needed to label who left it and when. BR-4.6 makes the
// handover note team-readable, so this route DELIBERATELY exposes it across
// members — unlike the roster, which excludes it. No attendance, cancel or pay
// field is ever selected here.
export type ShiftHandoverEntry = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  templateCode: string | null;
  templateName: string | null;
  memberName: string | null;
  handoverNote: string;
};

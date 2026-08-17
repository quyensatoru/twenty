import { Field, ObjectType } from '@nestjs/graphql';

// Handover projection of a COMPLETED shift: the operational handover note plus
// the minimal identity needed to label who left it and when. Per BR-4.6 the
// handover note is team-readable ("hiển thị trên chi tiết ca cho cả team đọc"),
// so this query DELIBERATELY exposes handoverNote across members — unlike the
// roster, which excludes it. Attendance/salary fields
// (checkInAt/checkOutAt/checkInLateMinutes/workingMinutes/cancelReason/
// cancelCategory/rateMultiplier) remain absent — they must never be selected
// into this DTO. That split is the security contract of the shiftHandovers query.
@ObjectType('ShiftHandoverEntry')
export class ShiftHandoverEntryDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  date: string;

  @Field(() => String, { nullable: true })
  startTime: string | null;

  @Field(() => String, { nullable: true })
  endTime: string | null;

  @Field(() => String, { nullable: true })
  templateCode: string | null;

  @Field(() => String, { nullable: true })
  templateName: string | null;

  @Field(() => String, { nullable: true })
  memberName: string | null;

  @Field(() => String)
  handoverNote: string;
}

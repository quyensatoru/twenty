import { Field, ObjectType } from '@nestjs/graphql';

// Team-roster projection of a shift: ONLY non-sensitive coverage fields cross the
// server boundary. Attendance/salary fields (checkInAt, checkOutAt,
// checkInLateMinutes, workingMinutes, handoverNote, cancelReason, cancelCategory,
// rateMultiplier) are deliberately absent — they must never be selected into this
// DTO. This is the security contract of the shiftRoster query.
@ObjectType('ShiftRosterEntry')
export class ShiftRosterEntryDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  date: string;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  templateCode: string | null;

  @Field(() => String, { nullable: true })
  templateName: string | null;

  @Field(() => String, { nullable: true })
  startTime: string | null;

  @Field(() => String, { nullable: true })
  endTime: string | null;

  @Field(() => String, { nullable: true })
  shiftTemplateId: string | null;

  @Field(() => String, { nullable: true })
  memberId: string | null;

  @Field(() => String, { nullable: true })
  memberName: string | null;
}

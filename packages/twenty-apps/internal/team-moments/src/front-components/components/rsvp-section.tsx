import { type Occurrence } from '../../types/occurrence';
import { type MemberSummary, type OccasionPlanRow, type RsvpStatus } from '../../types/moments-records';
import { countRsvps } from '../../utils/occasion-plan.util';
import { MOMENTS_TOKENS } from './moments-tokens';
import { SideSection } from './side-section';

type RsvpSectionProps = {
  occurrence: Occurrence;
  plan: OccasionPlanRow | null;
  currentMember: MemberSummary | null;
  memberNames: Record<string, string>;
  onChange: (status: RsvpStatus) => void;
};

const RSVP_OPTIONS: { status: RsvpStatus; label: string }[] = [
  { status: 'GOING', label: 'Tham gia' },
  { status: 'MAYBE', label: 'Có thể' },
  { status: 'NO', label: 'Không' },
];

export const RsvpSection = ({ occurrence, plan, currentMember, memberNames, onChange }: RsvpSectionProps) => {
  const myStatus = currentMember === null ? undefined : plan?.rsvps?.[currentMember.id];
  const counts = countRsvps(plan?.rsvps ?? null);
  const goingNames = Object.entries(plan?.rsvps ?? {})
    .filter(([, status]) => status === 'GOING')
    .map(([memberId]) => memberNames[memberId] ?? 'Thành viên');
  const when = [occurrence.startTime, occurrence.location].filter((part) => part !== null && part.length > 0).join(' · ');

  return (
    <SideSection title="Tham gia" aside={when.length > 0 ? when : undefined}>
      <div role="radiogroup" aria-label="Bạn có tham gia không" style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {RSVP_OPTIONS.map((option) => {
          const isSelected = option.status === myStatus;

          return (
            <button
              key={option.status}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={currentMember === null}
              onClick={() => onChange(option.status)}
              style={{
                background: isSelected ? '#E9F7EF' : MOMENTS_TOKENS.background,
                border: `1px solid ${isSelected ? '#2E9E5B' : MOMENTS_TOKENS.border}`,
                borderRadius: 6,
                color: isSelected ? '#1A5C38' : MOMENTS_TOKENS.textSecondary,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isSelected ? 600 : 400,
                height: 32,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 12, lineHeight: 1.5 }}>
        {counts.GOING} tham gia · {counts.MAYBE} có thể · {counts.NO} không
        {goingNames.length > 0 ? `: ${goingNames.slice(0, 6).join(', ')}${goingNames.length > 6 ? '…' : ''}` : ''}
      </div>
    </SideSection>
  );
};

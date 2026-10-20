import { useEffect, useState } from 'react';

import { type Occurrence } from '../../types/occurrence';
import { type EventCardRow, type MemberSummary } from '../../types/moments-records';
import { countRsvps, sumContributions, upsertContribution } from '../../utils/occasion-plan.util';
import { useOccasionPlan } from '../hooks/use-occasion-plan';
import { listRecords } from '../utils/moments-rest.util';
import { GiftFundSection } from './gift-fund-section';
import { GiftFundSettingsModal } from './gift-fund-settings-modal';
import { MOMENTS_TOKENS } from './moments-tokens';
import { RsvpSection } from './rsvp-section';
import { SideSection } from './side-section';

type OccasionSidePanelProps = {
  occurrence: Occurrence;
  currentMember: MemberSummary | null;
  memberNames: Record<string, string>;
  memberCount: number;
  onOpenCard: () => void;
};

type ChecklistItem = { key: string; isDone: boolean; text: string };

export const OccasionSidePanel = ({ occurrence, currentMember, memberNames, memberCount, onOpenCard }: OccasionSidePanelProps) => {
  const { plan, error, savePlan } = useOccasionPlan(occurrence.key);
  const [isEditingFund, setIsEditingFund] = useState(false);
  const [signatureCount, setSignatureCount] = useState(0);

  useEffect(() => {
    const load = () =>
      listRecords<EventCardRow>('eventCards', { filter: `occurrenceKey[eq]:"${occurrence.key}"`, limit: 1 })
        .then(([card]) => setSignatureCount(card?.signatures?.length ?? 0))
        .catch(() => setSignatureCount(0));

    void load();

    const timer = setInterval(() => void load(), 15_000);

    return () => clearInterval(timer);
  }, [occurrence.key]);

  const rsvpCounts = countRsvps(plan?.rsvps ?? null);
  const answered = rsvpCounts.GOING + rsvpCounts.MAYBE + rsvpCounts.NO;
  const total = sumContributions(plan?.contributions ?? null);
  const goal = plan?.giftGoal ?? null;

  const checklist: ChecklistItem[] = [
    { key: 'card', isDone: signatureCount > 0, text: signatureCount > 0 ? `${signatureCount} người đã ký thiệp chung` : 'Chưa ai ký thiệp chung' },
    {
      key: 'fund',
      isDone: goal !== null && total >= goal,
      text: goal === null ? 'Chưa mở quỹ quà' : `Quỹ quà đạt ${Math.min(100, Math.round((total / goal) * 100))}%`,
    },
    { key: 'rsvp', isDone: answered >= memberCount && memberCount > 0, text: `${rsvpCounts.GOING} người tham gia, ${Math.max(0, memberCount - answered)} người chưa trả lời` },
  ];

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      {error === null ? null : <span style={{ color: MOMENTS_TOKENS.danger, fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 12 }}>{error}</span>}

      <RsvpSection
        occurrence={occurrence}
        plan={plan}
        currentMember={currentMember}
        memberNames={memberNames}
        onChange={(status) => {
          if (currentMember !== null) {
            void savePlan((current) => ({ rsvps: { ...(current?.rsvps ?? {}), [currentMember.id]: status } }));
          }
        }}
      />

      <GiftFundSection
        occurrence={occurrence}
        plan={plan}
        currentMember={currentMember}
        onEditSettings={() => setIsEditingFund(true)}
        onContribute={(amount) =>
          currentMember === null
            ? Promise.resolve(false)
            : savePlan((current) => ({
                contributions: upsertContribution(current?.contributions ?? null, {
                  memberId: currentMember.id,
                  name: currentMember.name,
                  amount,
                  contributedAt: new Date().toISOString(),
                }),
              }))
        }
        onWithdraw={() =>
          currentMember === null
            ? Promise.resolve(false)
            : savePlan((current) => ({
                contributions: (current?.contributions ?? []).filter((contribution) => contribution.memberId !== currentMember.id),
              }))
        }
      />

      <SideSection title="Việc cần làm">
        {checklist.map((item) => (
          <div key={item.key} style={{ alignItems: 'flex-start', color: MOMENTS_TOKENS.textSecondary, display: 'flex', fontSize: 13, gap: 8, lineHeight: 1.45 }}>
            <span aria-hidden="true" style={{ color: item.isDone ? '#2E9E5B' : MOMENTS_TOKENS.textTertiary, width: 12 }}>{item.isDone ? '✓' : '○'}</span>
            {item.text}
          </div>
        ))}
        <button type="button" onClick={onOpenCard} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: MOMENTS_TOKENS.accent, cursor: 'pointer', fontSize: 12, padding: 0 }}>
          Mở thiệp chung để ký
        </button>
      </SideSection>

      {isEditingFund ? (
        <GiftFundSettingsModal
          plan={plan}
          onClose={() => setIsEditingFund(false)}
          onSave={(settings) =>
            savePlan((current) => ({ ...settings, organizerId: current?.organizerId ?? currentMember?.id ?? null }))
          }
        />
      ) : null}
    </aside>
  );
};

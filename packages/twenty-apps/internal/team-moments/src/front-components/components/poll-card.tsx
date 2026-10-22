import { useEffect, useRef, useState } from 'react';

import { type MemberSummary, type PollRow } from '../../types/moments-records';
import { MomentsButton } from './moments-button';
import { MOMENTS_TOKENS } from './moments-tokens';

type PollCardProps = {
  poll: PollRow;
  currentMemberId: string | null;
  members: MemberSummary[];
  isOpenByAnchor: boolean;
  canManage: boolean;
  previewUrl: string;
  onVote: (optionId: string) => Promise<void>;
  onClose: () => Promise<void>;
  onDelete: () => Promise<void>;
};

// Team Moments' own identity color, same coral used in the Mattermost
// attachment and thumbnail so the two surfaces read as one feature. Kept as
// a small accent (icons, the "mine"/leading marks), not a block fill, to sit
// inside Twenty's own card chrome rather than override it.
const POLL_ACCENT = '#FF6353';
const POLL_ACCENT_SOFT = 'rgba(255, 99, 83, 0.12)';

const findMember = (members: MemberSummary[], memberId: string): MemberSummary | undefined =>
  members.find((member) => member.id === memberId);

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const Avatar = ({ member }: { member: MemberSummary | undefined }) => {
  const name = member?.name ?? 'Thành viên';

  return member?.avatarUrl ? (
    <img
      src={member.avatarUrl}
      alt={name}
      style={{ borderRadius: '50%', flexShrink: 0, height: 16, objectFit: 'cover', width: 16 }}
    />
  ) : (
    <div
      style={{
        alignItems: 'center',
        background: MOMENTS_TOKENS.backgroundTertiary,
        borderRadius: '50%',
        color: MOMENTS_TOKENS.textSecondary,
        display: 'flex',
        flexShrink: 0,
        fontSize: 8,
        fontWeight: 600,
        height: 16,
        justifyContent: 'center',
        width: 16,
      }}
    >
      {initialsOf(name)}
    </div>
  );
};

// Tabler's check / trophy outlines, redrawn minimal: emoji read as a
// different visual language than Twenty's own stroke-based icon set.
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={POLL_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5l10 -10" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21l8 0" />
    <path d="M12 17l0 4" />
    <path d="M7 4l10 0l0 5a5 5 0 0 1 -10 0l0 -5" />
    <path d="M17 6h2a2 2 0 0 1 2 2a3 3 0 0 1 -3 3" />
    <path d="M7 6h-2a2 2 0 0 0 -2 2a3 3 0 0 0 3 3" />
  </svg>
);

export const PollCard = ({
  poll,
  currentMemberId,
  members,
  isOpenByAnchor,
  canManage,
  previewUrl,
  onVote,
  onClose,
  onDelete,
}: PollCardProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const votes = poll.votes ?? [];
  const options = poll.options ?? [];
  const totalVotes = votes.length;
  const myVote = currentMemberId === null ? null : votes.find((vote) => vote.memberId === currentMemberId) ?? null;
  const isOpen = poll.status === 'OPEN';
  const maxVotes = Math.max(0, ...options.map((option) => votes.filter((vote) => vote.optionId === option.id).length));
  const creator = poll.createdById === null ? undefined : findMember(members, poll.createdById);

  // Scrolls itself into view once, using its own React-managed DOM node: the
  // front component's global `document` is sandboxed and does not return a
  // real Element, so `document.getElementById(...).scrollIntoView` throws.
  useEffect(() => {
    if (isOpenByAnchor) {
      rootRef.current?.scrollIntoView?.({ block: 'center' });
    }
  }, [isOpenByAnchor]);

  const castVote = async (optionId: string) => {
    if (!isOpen || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onVote(optionId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={rootRef}
      style={{
        background: isOpenByAnchor ? POLL_ACCENT_SOFT : MOMENTS_TOKENS.background,
        border: `1px solid ${isOpenByAnchor ? POLL_ACCENT : MOMENTS_TOKENS.border}`,
        borderRadius: 8,
        boxShadow: 'var(--t-box-shadow-light, 0 2px 4px rgba(0,0,0,0.04))',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 16px',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ color: MOMENTS_TOKENS.textPrimary, fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 14, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
          {poll.question}
        </h3>
        <span
          style={{
            alignItems: 'center',
            color: isOpen ? MOMENTS_TOKENS.green : MOMENTS_TOKENS.textTertiary,
            display: 'flex',
            flexShrink: 0,
            fontFamily: MOMENTS_TOKENS.fontFamily,
            fontSize: 11,
            fontWeight: 500,
            gap: 5,
          }}
        >
          <span
            aria-hidden
            style={{
              background: isOpen ? MOMENTS_TOKENS.green : MOMENTS_TOKENS.textTertiary,
              borderRadius: '50%',
              display: 'inline-block',
              height: 6,
              width: 6,
            }}
          />
          {isOpen ? 'Đang mở' : 'Đã đóng'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {options.map((option, index) => {
          const optionVotes = votes.filter((vote) => vote.optionId === option.id).length;
          const percent = totalVotes === 0 ? 0 : Math.round((optionVotes / totalVotes) * 100);
          const isMine = myVote?.optionId === option.id;
          const isLeading = totalVotes > 0 && optionVotes === maxVotes && maxVotes > 0;

          return (
            <button
              key={option.id}
              type="button"
              disabled={!isOpen || isSubmitting}
              onClick={() => void castVote(option.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderTop: index === 0 ? 'none' : `1px solid ${MOMENTS_TOKENS.borderLight}`,
                cursor: isOpen ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                padding: '7px 2px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ alignItems: 'center', color: MOMENTS_TOKENS.textPrimary, display: 'flex', fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 13, fontWeight: isMine ? 600 : 400, gap: 6 }}>
                  {isMine ? <CheckIcon /> : null}
                  {option.emoji === null ? '' : `${option.emoji} `}
                  {option.label}
                </span>
                <span style={{ alignItems: 'center', color: MOMENTS_TOKENS.textSecondary, display: 'flex', fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 12, fontWeight: isLeading ? 600 : 400, gap: 4 }}>
                  {isLeading ? <TrophyIcon /> : null}
                  {percent}% · {optionVotes}
                </span>
              </div>
              <div style={{ background: MOMENTS_TOKENS.backgroundTertiary, borderRadius: 2, height: 4, overflow: 'hidden', width: '100%' }}>
                <div
                  style={{
                    background: isMine ? POLL_ACCENT : MOMENTS_TOKENS.borderStrong,
                    borderRadius: 2,
                    height: '100%',
                    transition: 'width 0.35s ease',
                    width: `${percent}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ alignItems: 'center', borderTop: `1px solid ${MOMENTS_TOKENS.borderLight}`, display: 'flex', fontFamily: MOMENTS_TOKENS.fontFamily, justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10 }}>
        <div style={{ alignItems: 'center', color: MOMENTS_TOKENS.textTertiary, display: 'flex', fontSize: 11.5, gap: 6 }}>
          <Avatar member={creator} />
          <span>
            {totalVotes} vote
            {creator === undefined ? '' : ` · ${creator.name}`}
          </span>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 2 }}>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              alignItems: 'center',
              color: MOMENTS_TOKENS.textTertiary,
              display: 'inline-flex',
              fontFamily: MOMENTS_TOKENS.fontFamily,
              fontSize: 11.5,
              height: 24,
              padding: '0 6px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Mattermost ↗
          </a>
          {!canManage ? null : isConfirmingDelete ? (
            <>
              <span style={{ color: MOMENTS_TOKENS.textTertiary, fontSize: 11.5 }}>Xoá poll này?</span>
              <MomentsButton variant="ghost" size="small" onClick={() => setIsConfirmingDelete(false)}>Huỷ</MomentsButton>
              <button
                type="button"
                onClick={() => void onDelete()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: MOMENTS_TOKENS.danger,
                  cursor: 'pointer',
                  fontFamily: MOMENTS_TOKENS.fontFamily,
                  fontSize: 13,
                  fontWeight: 500,
                  height: 26,
                  padding: '0 8px',
                }}
              >
                Xoá
              </button>
            </>
          ) : (
            <>
              {!isOpen ? null : <MomentsButton variant="ghost" size="small" onClick={() => void onClose()}>Đóng poll</MomentsButton>}
              <MomentsButton variant="ghost" size="small" onClick={() => setIsConfirmingDelete(true)}>Xoá</MomentsButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

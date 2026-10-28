import { useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import { PREVIEW_POLL_ROUTE_PATH } from '../constants/route-paths';
import { POLLS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type PollOption, type PollRow } from '../types/moments-records';
import { parsePollAnchor } from '../utils/polls-anchor.util';
import { MomentsButton } from './components/moments-button';
import { MOMENTS_TOKENS } from './components/moments-tokens';
import { PollCard } from './components/poll-card';
import { PollFormModal, type PollFormInput } from './components/poll-form-modal';
import { usePollsData } from './hooks/use-polls-data';
import { createRecord, deleteRecord, postAppRoute, readErrorText, resolveAppRouteUrl, updateRecord } from './utils/moments-rest.util';
import { useHostLocationHash } from './hooks/use-host-location';

const createOptionId = (): string => {
  const bytes = new Uint8Array(8);

  crypto.getRandomValues(bytes);

  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const Polls = () => {
  const data = usePollsData();
  const locationHash = useHostLocationHash();
  const [anchoredPollId] = useState(() => parsePollAnchor(locationHash));
  const [isCreating, setIsCreating] = useState(false);

  const createPoll = async (input: PollFormInput) => {
    const options: PollOption[] = input.options.map((option) => ({
      id: createOptionId(),
      label: option.label,
      emoji: option.emoji.trim() === '' ? null : option.emoji.trim(),
    }));

    const poll = await createRecord<PollRow>('polls', {
      question: input.question,
      status: 'OPEN',
      options,
      votes: [],
      createdById: data.currentMemberId,
    });

    setIsCreating(false);

    try {
      const published = await postAppRoute<{ success: boolean; mattermostPostId?: string; mattermostChannelId?: string }>(
        '/moments/polls/publish',
        { pollId: poll.id },
      );

      if (published.mattermostPostId !== undefined) {
        await updateRecord('polls', poll.id, {
          mattermostPostId: published.mattermostPostId,
          mattermostChannelId: published.mattermostChannelId ?? null,
        });
      }

      void enqueueSnackbar({ message: 'Đã tạo poll và đăng lên Mattermost.', variant: 'success' });
    } catch (publishError) {
      void enqueueSnackbar({ message: `Đã tạo poll, nhưng chưa đăng được lên Mattermost: ${readErrorText(publishError)}`, variant: 'error' });
    }

    await data.reload();
  };

  const castVote = async (poll: PollRow, optionId: string) => {
    if (data.currentMemberId === null) return;

    const votes = (poll.votes ?? []).filter((vote) => vote.memberId !== data.currentMemberId);
    votes.push({ memberId: data.currentMemberId, optionId, votedAt: new Date().toISOString() });

    await updateRecord('polls', poll.id, { votes });
    await data.reload();

    try {
      await postAppRoute('/moments/polls/refresh', { pollId: poll.id });
    } catch {
      // The vote is already saved; a failed Mattermost refresh is not worth
      // surfacing to the voter.
    }
  };

  const closePoll = async (poll: PollRow) => {
    await updateRecord('polls', poll.id, { status: 'CLOSED' });
    await data.reload();

    try {
      await postAppRoute('/moments/polls/refresh', { pollId: poll.id });
    } catch {
      // Same as above: best-effort only.
    }
  };

  const deletePoll = async (poll: PollRow) => {
    await deleteRecord('polls', poll.id);
    await data.reload();
  };

  return (
    <div style={{ background: MOMENTS_TOKENS.background, boxSizing: 'border-box', color: MOMENTS_TOKENS.textPrimary, display: 'flex', flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, height: '100%', minHeight: 0 }}>
      <header style={{ alignItems: 'center', borderBottom: `1px solid ${MOMENTS_TOKENS.border}`, display: 'flex', gap: 8, padding: '12px 16px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Polls</h2>
          <span style={{ color: MOMENTS_TOKENS.textTertiary, fontSize: 12 }}>
            {data.polls.filter((poll) => poll.status === 'OPEN').length} đang mở · {data.polls.length} tổng cộng
          </span>
        </div>
        <MomentsButton variant="primary" onClick={() => setIsCreating(true)}>+ Tạo poll</MomentsButton>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
        <div
          style={{
            alignContent: 'start',
            alignItems: 'stretch',
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            margin: '0 auto',
            maxWidth: 900,
          }}
        >
          {data.error === null ? null : <div style={{ color: MOMENTS_TOKENS.danger, fontSize: 13, gridColumn: '1 / -1' }}>{data.error}</div>}
          {data.isLoading ? (
            <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, gridColumn: '1 / -1' }}>Đang tải...</div>
          ) : data.polls.length === 0 ? (
            <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, gridColumn: '1 / -1' }}>Chưa có poll nào. Tạo poll đầu tiên nhé.</div>
          ) : (
            data.polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                currentMemberId={data.currentMemberId}
                members={data.members}
                isOpenByAnchor={poll.id === anchoredPollId}
                canManage={poll.createdById === data.currentMemberId}
                previewUrl={resolveAppRouteUrl(PREVIEW_POLL_ROUTE_PATH, { id: poll.id })}
                onVote={(optionId) => castVote(poll, optionId)}
                onClose={() => closePoll(poll)}
                onDelete={() => deletePoll(poll)}
              />
            ))
          )}
        </div>
      </div>

      {isCreating ? <PollFormModal onClose={() => setIsCreating(false)} onSubmit={createPoll} /> : null}
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: POLLS_FRONT_COMPONENT_UID,
  name: 'team-moments-polls',
  description: 'Polls created in Twenty, posted to Mattermost, voted on from Twenty',
  component: Polls,
});

import { useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import { MOMENTS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type TeamEventRow } from '../types/moments-records';
import { getMissingDefaultHolidays } from '../utils/get-missing-default-holidays.util';
import { EventFormModal, type TeamEventInput } from './components/event-form-modal';
import { MembersView } from './components/members-view';
import { MomentsButton } from './components/moments-button';
import { MOMENTS_TOKENS } from './components/moments-tokens';
import { OverviewView } from './components/overview-view';
import { RoomView } from './components/room-view';
import { useMomentsData } from './hooks/use-moments-data';
import { createRecord, readErrorText } from './utils/moments-rest.util';

type MomentsTab = 'overview' | 'members';

const Moments = () => {
  const data = useMomentsData();
  const [tab, setTab] = useState<MomentsTab>('overview');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const openOccurrence = data.occurrences.find((occurrence) => occurrence.key === openKey) ?? null;
  const missingHolidays = getMissingDefaultHolidays(data.events);

  const createEvent = async (input: TeamEventInput) => {
    await createRecord<TeamEventRow>('teamEvents', {
      ...input,
      startTime: input.startTime || null,
      location: input.location || null,
      description: input.description || null,
      organizerId: data.currentMember?.id ?? null,
    });
    await data.reload();
    setIsCreatingEvent(false);
    void enqueueSnackbar({ message: 'Đã tạo sự kiện.', variant: 'success' });
  };

  const seedHolidays = async () => {
    setIsSeeding(true);

    try {
      for (const holiday of missingHolidays) {
        await createRecord('teamEvents', { ...holiday, kind: 'HOLIDAY' });
      }

      await data.reload();
      void enqueueSnackbar({ message: `Đã thêm ${missingHolidays.length} ngày lễ.`, variant: 'success' });
    } catch (seedError) {
      void enqueueSnackbar({ message: readErrorText(seedError), variant: 'error' });
    } finally {
      setIsSeeding(false);
    }
  };

  const tabButton = (key: MomentsTab, label: string) => {
    const isSelected = key === tab && openOccurrence === null;

    return (
      <button
        type="button"
        role="tab"
        aria-selected={isSelected}
        onClick={() => {
          setTab(key);
          setOpenKey(null);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: isSelected ? `inset 0 -2px 0 ${MOMENTS_TOKENS.textPrimary}` : 'none',
          color: isSelected ? MOMENTS_TOKENS.textPrimary : MOMENTS_TOKENS.textSecondary,
          cursor: 'pointer',
          fontFamily: MOMENTS_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: isSelected ? 600 : 400,
          height: 44,
          padding: '0 10px',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ background: MOMENTS_TOKENS.background, boxSizing: 'border-box', color: MOMENTS_TOKENS.textPrimary, display: 'flex', flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, height: '100%', minHeight: 0 }}>
      <header style={{ alignItems: 'center', borderBottom: `1px solid ${MOMENTS_TOKENS.border}`, display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px' }}>
        <div role="tablist" aria-label="Team Moments" style={{ display: 'flex', gap: 4 }}>
          {tabButton('overview', 'Tổng quan')}
          {tabButton('members', 'Thành viên')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 'auto', padding: '6px 0' }}>
          {missingHolidays.length === 0 || data.isLoading ? null : (
            <MomentsButton variant="secondary" isDisabled={isSeeding} onClick={() => void seedHolidays()}>
              {`Thêm ${missingHolidays.length} ngày lễ Việt Nam`}
            </MomentsButton>
          )}
          <MomentsButton variant="primary" onClick={() => setIsCreatingEvent(true)}>+ Thêm sự kiện</MomentsButton>
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {data.error === null ? null : (
          <div style={{ color: MOMENTS_TOKENS.danger, fontSize: 13, padding: '12px 24px' }}>{data.error}</div>
        )}
        {data.isLoading ? (
          <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, padding: 24 }}>Đang tải...</div>
        ) : openOccurrence !== null ? (
          <RoomView
            occurrence={openOccurrence}
            currentMember={data.currentMember}
            memberNames={data.memberNames}
            memberCount={data.members.length}
            onBack={() => setOpenKey(null)}
          />
        ) : tab === 'overview' ? (
          <OverviewView todayIso={data.todayIso} occurrences={data.occurrences} onOpen={(occurrence) => setOpenKey(occurrence.key)} />
        ) : (
          <MembersView
            members={data.members}
            profiles={data.profiles}
            todayIso={data.todayIso}
            currentMemberId={data.currentMember?.id ?? null}
            onSaved={data.reload}
          />
        )}
      </div>

      {isCreatingEvent ? (
        <EventFormModal todayIso={data.todayIso} onClose={() => setIsCreatingEvent(false)} onSubmit={createEvent} />
      ) : null}
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: MOMENTS_FRONT_COMPONENT_UID,
  name: 'team-moments',
  description: 'Countdowns, chat rooms and shared cards for team occasions',
  component: Moments,
});

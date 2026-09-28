import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t } from 'twenty-sdk/front-component';

import { REPORT_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type ShiftMember } from '../types/shift-member';
import { type ShiftRow } from '../types/shift-row';
import { type ShiftTemplateRow } from '../types/shift-template-row';
import {
  formatMonthLabel,
  getMonthRange,
  getRecentMonthValues,
} from '../utils/shift-calendar.util';
import { computeMonthReport } from '../utils/shift-report.util';
import { ShiftButton } from './components/shift-button';
import { ShiftField } from './components/shift-field';
import { ShiftPage } from './components/shift-page';
import { ShiftReportStatCards } from './components/shift-report-stat-cards';
import { ShiftReportTable } from './components/shift-report-table';
import { ShiftSelect } from './components/shift-select';
import { ShiftStateMessage } from './components/shift-state-message';
import { SHIFT_TOKENS } from './components/shift-tokens';
import { fetchCatalog } from './utils/fetch-catalog.util';
import { fetchMembers } from './utils/fetch-members.util';
import { fetchMyShifts } from './utils/fetch-my-shifts.util';
import { readErrorText } from './utils/read-error-text.util';

const RECENT_MONTHS_COUNT = 24;

const Report = () => {
  const monthValues = useMemo(
    () => getRecentMonthValues(RECENT_MONTHS_COUNT),
    [],
  );

  const [selectedMonth, setSelectedMonth] = useState(monthValues[0]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<ShiftMember[]>([]);
  // Only a Leader/PO may read another member's report. The member route decides
  // it; the shifts route enforces it again, so the picker is a convenience, not
  // the gate.
  const [canViewAllMembers, setCanViewAllMembers] = useState(false);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { fromDate, toDate } = useMemo(
    () => getMonthRange(selectedMonth),
    [selectedMonth],
  );

  const reload = async () => {
    try {
      const result = await fetchMyShifts({
        fromDate,
        toDate,
        memberId: selectedMemberId ?? undefined,
      });

      setShifts(result.shifts);
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await reload();
      setIsLoading(false);
    };

    void load();
  }, [fromDate, toDate, selectedMemberId]);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const actor = await fetchMembers();

        setMembers(actor.members);
        setCanViewAllMembers(actor.isElevated);
        setSelectedMemberId(actor.workspaceMemberId);
      } catch {
        setMembers([]);
        setCanViewAllMembers(false);
      }

      try {
        setShiftTemplates((await fetchCatalog()).shiftTemplates);
      } catch {
        setShiftTemplates([]);
      }
    };

    void loadContext();
  }, []);

  const templatesById = useMemo(() => {
    const map: Record<string, ShiftTemplateRow> = {};

    for (const template of shiftTemplates) {
      map[template.id] = template;
    }

    return map;
  }, [shiftTemplates]);

  const report = useMemo(
    () => computeMonthReport(shifts, templatesById),
    [shifts, templatesById],
  );

  const monthOptions = useMemo(
    () =>
      monthValues.map((monthValue) => ({
        label: formatMonthLabel(monthValue),
        value: monthValue,
      })),
    [monthValues],
  );

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        label: member.name ?? member.email ?? member.id,
        value: member.id,
      })),
    [members],
  );

  const renderBody = () => {
    if (isLoading && shifts.length === 0) {
      return <ShiftStateMessage message={t('Loading…')} />;
    }

    if (loadError !== null && shifts.length === 0) {
      return (
        <ShiftStateMessage
          message={t("Couldn't load the report.")}
          action={
            <ShiftButton variant="primary" onClick={() => void reload()}>
              {t('Retry')}
            </ShiftButton>
          }
        />
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ShiftReportStatCards report={report} />
        {shifts.length === 0 ? (
          <ShiftStateMessage message={t('No shifts this month.')} />
        ) : (
          <ShiftReportTable shifts={shifts} templateById={templatesById} />
        )}
        <p
          style={{
            color: SHIFT_TOKENS.textTertiary,
            fontSize: 12,
            margin: 0,
          }}
        >
          {t('Verify totals and send to PO at month end')}
        </p>
      </div>
    );
  };

  return (
    <ShiftPage
      title={t('Shift report')}
      subtitle={formatMonthLabel(selectedMonth)}
      actions={
        <div
          style={{
            alignItems: 'flex-end',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {canViewAllMembers && selectedMemberId !== null ? (
            <div style={{ minWidth: 200 }}>
              <ShiftField label={t('Member')}>
                <ShiftSelect
                  value={selectedMemberId}
                  options={memberOptions}
                  onChange={setSelectedMemberId}
                  ariaLabel={t('Member')}
                />
              </ShiftField>
            </div>
          ) : null}
          <div style={{ minWidth: 180 }}>
            <ShiftField label={t('Month')}>
              <ShiftSelect
                value={selectedMonth}
                options={monthOptions}
                onChange={setSelectedMonth}
                ariaLabel={t('Month')}
              />
            </ShiftField>
          </div>
        </div>
      }
    >
      {renderBody()}
    </ShiftPage>
  );
};

export default defineFrontComponent({
  universalIdentifier: REPORT_FRONT_COMPONENT_UID,
  name: 'shift-report',
  description:
    'Report: the monthly attendance totals and week-by-week shift table a member reconciles.',
  component: Report,
});

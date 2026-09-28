import { t } from 'twenty-sdk/front-component';

import { type MonthReport } from '../../utils/shift-report.util';
import { ShiftStatCard } from './shift-card';

const EARNINGS_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

type ShiftReportStatCardsProps = { report: MonthReport };

export const ShiftReportStatCards = ({ report }: ShiftReportStatCardsProps) => {
  const cards: { key: string; label: string; value: string }[] = [
    {
      key: 'registered-shifts',
      label: t('Registered shifts'),
      value: String(report.registeredShiftCount),
    },
    {
      key: 'registered-hours',
      label: t('Registered hours'),
      value: `${report.registeredHours}h`,
    },
    {
      key: 'completed',
      label: t('Completed'),
      value: String(report.completedCount),
    },
    { key: 'absent', label: t('Absent'), value: String(report.absentCount) },
    {
      key: 'check-in-late',
      label: t('Check-in late'),
      value: String(report.checkInLateCount),
    },
    {
      key: 'cancelled',
      label: t('Cancelled'),
      value: String(report.cancelledCount),
    },
    {
      key: 'total-working-hours',
      label: t('Total working hours'),
      value: `${report.totalWorkingHours}h`,
    },
    {
      key: 'overtime-hours',
      label: t('Overtime hours'),
      value: `${report.overtimeHours}h`,
    },
  ];

  if (report.earnings !== null) {
    cards.push({
      key: 'est-earnings',
      label: t('Est. earnings'),
      value: EARNINGS_FORMATTER.format(report.earnings),
    });
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      }}
    >
      {cards.map((card) => (
        <ShiftStatCard key={card.key} value={card.value} label={card.label} />
      ))}
    </div>
  );
};

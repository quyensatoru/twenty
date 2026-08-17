import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type MonthReport } from '@/shift/utils/shiftReport';

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing['3']};
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
`;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['1']};
  padding: ${themeCssVariables.spacing['4']};
`;

const StyledValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const EARNINGS_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

type StatCard = {
  key: string;
  label: string;
  value: string;
};

type ShiftReportStatCardsProps = {
  report: MonthReport;
};

export const ShiftReportStatCards = ({ report }: ShiftReportStatCardsProps) => {
  const { t } = useLingui();

  const cards: StatCard[] = [
    {
      key: 'registered-shifts',
      label: t`Registered shifts`,
      value: String(report.registeredShiftCount),
    },
    {
      key: 'registered-hours',
      label: t`Registered hours`,
      value: `${report.registeredHours}h`,
    },
    {
      key: 'completed',
      label: t`Completed`,
      value: String(report.completedCount),
    },
    {
      key: 'absent',
      label: t`Absent`,
      value: String(report.absentCount),
    },
    {
      key: 'check-in-late',
      label: t`Check-in late`,
      value: String(report.checkInLateCount),
    },
    {
      key: 'cancelled',
      label: t`Cancelled`,
      value: String(report.cancelledCount),
    },
    {
      key: 'total-working-hours',
      label: t`Total working hours`,
      value: `${report.totalWorkingHours}h`,
    },
    {
      key: 'overtime-hours',
      label: t`Overtime hours`,
      value: `${report.overtimeHours}h`,
    },
  ];

  if (isDefined(report.earnings)) {
    cards.push({
      key: 'est-earnings',
      label: t`Est. earnings`,
      value: EARNINGS_FORMATTER.format(report.earnings),
    });
  }

  return (
    <StyledGrid>
      {cards.map((card) => (
        <StyledCard key={card.key}>
          <StyledValue>{card.value}</StyledValue>
          <StyledLabel>{card.label}</StyledLabel>
        </StyledCard>
      ))}
    </StyledGrid>
  );
};

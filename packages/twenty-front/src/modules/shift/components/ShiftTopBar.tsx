import { type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledTopBar = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing['4']};
  padding: ${themeCssVariables.spacing['2']} ${themeCssVariables.spacing['4']};
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledTabs = styled.div`
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing['1']};
`;

const StyledTab = styled.button<{ isActive: boolean }>`
  background: ${({ isActive }) =>
    isActive ? themeCssVariables.background.tertiary : 'transparent'};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.weight.semiBold
      : themeCssVariables.font.weight.regular};
  padding: ${themeCssVariables.spacing['1']} ${themeCssVariables.spacing['3']};
`;

const StyledRightSlot = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
`;

const TABS = [
  { path: AppPath.ShiftPage, label: <Trans>My Week</Trans> },
  { path: AppPath.ShiftRegisterPage, label: <Trans>Register</Trans> },
  { path: AppPath.ShiftReportPage, label: <Trans>Report</Trans> },
  { path: AppPath.ShiftAnalyticsPage, label: <Trans>Analytics</Trans> },
];

type ShiftTopBarProps = {
  rightSlot?: ReactNode;
};

export const ShiftTopBar = ({ rightSlot }: ShiftTopBarProps) => {
  const goToTab = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const handleTabClick = (path: AppPath) => {
    goToTab({
      pathname: path,
      search: searchParams.toString(),
    });
  };

  return (
    <StyledTopBar>
      <StyledTitle>
        <Trans>Shifts</Trans>
      </StyledTitle>
      <StyledTabs>
        {TABS.map((tab) => (
          <StyledTab
            key={tab.path}
            type="button"
            isActive={location.pathname === tab.path}
            onClick={() => handleTabClick(tab.path)}
          >
            {tab.label}
          </StyledTab>
        ))}
      </StyledTabs>
      <StyledRightSlot>{rightSlot}</StyledRightSlot>
    </StyledTopBar>
  );
};

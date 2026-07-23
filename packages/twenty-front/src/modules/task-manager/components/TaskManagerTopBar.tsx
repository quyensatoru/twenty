import { type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useTaskManagerProjects } from '@/task-manager/hooks/useTaskManagerProjects';

const StyledTopBar = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing['4']};
  padding: ${themeCssVariables.spacing['2']} ${themeCssVariables.spacing['4']};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing['1']} ${themeCssVariables.spacing['2']};
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
  { path: AppPath.TaskManagerBoardPage, label: <Trans>Board</Trans> },
  { path: AppPath.TaskManagerBacklogPage, label: <Trans>Backlog</Trans> },
  { path: AppPath.TaskManagerRoadmapPage, label: <Trans>Roadmap</Trans> },
];

type TaskManagerTopBarProps = {
  rightSlot?: ReactNode;
};

export const TaskManagerTopBar = ({ rightSlot }: TaskManagerTopBarProps) => {
  const goToTab = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { projects } = useTaskManagerProjects();

  const selectedProjectId = searchParams.get('project') ?? '';

  const handleProjectChange = (projectId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (projectId) {
      nextSearchParams.set('project', projectId);
    } else {
      nextSearchParams.delete('project');
    }

    setSearchParams(nextSearchParams);
  };

  const handleTabClick = (path: AppPath) => {
    goToTab({
      pathname: path,
      search: searchParams.toString(),
    });
  };

  return (
    <StyledTopBar>
      <StyledSelect
        value={selectedProjectId}
        onChange={(event) => handleProjectChange(event.target.value)}
      >
        <option value="">
          <Trans>All projects</Trans>
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name as string}
          </option>
        ))}
      </StyledSelect>
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

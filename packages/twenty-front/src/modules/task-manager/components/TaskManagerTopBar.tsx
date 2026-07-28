import { type ReactNode, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { AppPath } from 'twenty-shared/types';
import { IconPlus } from 'twenty-ui/icon';
import { Button, type SelectOption } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useTaskManagerProjects } from '@/task-manager/hooks/useTaskManagerProjects';
import { Select } from '@/ui/input/components/Select';

const StyledTopBar = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing['4']};
  padding: ${themeCssVariables.spacing['2']} ${themeCssVariables.spacing['4']};
`;

const StyledProjectSelect = styled.div`
  min-width: 160px;
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
  const { t } = useLingui();
  const goToTab = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { projects } = useTaskManagerProjects();
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'issue',
  });
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const selectedProjectId = searchParams.get('project') ?? '';

  const projectOptions: SelectOption<string>[] = useMemo(
    () =>
      projects.map((project) => ({
        label: project.name as string,
        value: project.id,
      })),
    [projects],
  );

  const handleProjectChange = (projectId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (projectId) {
      nextSearchParams.set('project', projectId);
    } else {
      nextSearchParams.delete('project');
    }

    setSearchParams(nextSearchParams);
  };

  // A member scoped to a single project has nothing to pick — auto-select it
  // instead of defaulting to the "All projects" option, which would misleadingly
  // suggest there's a broader scope to switch away from.
  useEffect(() => {
    if (projects.length === 1 && !selectedProjectId) {
      handleProjectChange(projects[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, selectedProjectId]);

  const handleTabClick = (path: AppPath) => {
    goToTab({
      pathname: path,
      search: searchParams.toString(),
    });
  };

  const handleCreateIssue = async () => {
    const targetProjectId = selectedProjectId || projects[0]?.id;

    if (!targetProjectId) {
      return;
    }

    const newIssue = await createOneRecord({ projectId: targetProjectId });

    openRecordInSidePanel({
      recordId: newIssue.id,
      objectNameSingular: 'issue',
      isNewRecord: true,
    });
  };

  return (
    <StyledTopBar>
      <StyledProjectSelect>
        <Select
          dropdownId="task-manager-project-select"
          options={projectOptions}
          value={selectedProjectId}
          emptyOption={
            projects.length === 1
              ? undefined
              : { label: t`All projects`, value: '' }
          }
          onChange={handleProjectChange}
          withSearchInput={projectOptions.length > 5}
          fullWidth
        />
      </StyledProjectSelect>
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
      <StyledRightSlot>
        {rightSlot}
        <Button
          title={t`New Issue`}
          Icon={IconPlus}
          accent="blue"
          onClick={handleCreateIssue}
          disabled={projects.length === 0}
        />
      </StyledRightSlot>
    </StyledTopBar>
  );
};

import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledTrack = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.rounded};
  height: 6px;
  overflow: hidden;
  width: 100%;
`;

const StyledFill = styled.div<{ percentage: number }>`
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.rounded};
  height: 100%;
  width: ${({ percentage }) => percentage}%;
`;

type ProjectEpicProgressBarProps = {
  doneCount: number;
  totalCount: number;
};

export const ProjectEpicProgressBar = ({
  doneCount,
  totalCount,
}: ProjectEpicProgressBarProps) => {
  const percentage = totalCount === 0 ? 0 : (doneCount / totalCount) * 100;

  return (
    <StyledTrack>
      <StyledFill percentage={percentage} />
    </StyledTrack>
  );
};

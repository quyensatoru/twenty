import { t } from 'twenty-sdk/front-component';
import {
  IconArrowMerge,
  IconCheck,
  IconCircleX,
  IconClock,
  IconLoader,
  IconRocket,
} from 'twenty-ui/icon';

import { type DevelopmentActivitySummary } from '../utils/summarize-development-activity.util';
import { DevelopmentChip } from './development-status';

type DevelopmentSummaryChipsProps = {
  summary: DevelopmentActivitySummary;
};

const readPullRequestChip = (status: string) => {
  switch (status) {
    case 'MERGED':
      return { label: t('PR merged'), color: 'purple' };
    case 'CLOSED':
      return { label: t('PR closed'), color: 'gray' };
    case 'DRAFT':
      return { label: t('PR draft'), color: 'gray' };
    default:
      return { label: t('PR open'), color: 'green' };
  }
};

const readBuildChip = (status: string) => {
  switch (status) {
    case 'SUCCESSFUL':
      return { label: t('Build passed'), color: 'green', Icon: IconCheck };
    case 'FAILED':
      return { label: t('Build failed'), color: 'red', Icon: IconCircleX };
    case 'IN_PROGRESS':
      return { label: t('Build running'), color: 'blue', Icon: IconLoader };
    case 'CANCELLED':
      return { label: t('Build cancelled'), color: 'gray', Icon: IconCircleX };
    default:
      return { label: t('Build pending'), color: 'gray', Icon: IconClock };
  }
};

const readEnvironmentLabel = (
  deployment: NonNullable<DevelopmentActivitySummary['deployment']>,
): string => {
  if (
    typeof deployment.environmentName === 'string' &&
    deployment.environmentName !== ''
  ) {
    return deployment.environmentName;
  }

  switch (deployment.environmentType) {
    case 'PRODUCTION':
      return t('Production');
    case 'STAGING':
      return t('Staging');
    case 'TESTING':
      return t('Testing');
    case 'DEVELOPMENT':
      return t('Development');
    default:
      return t('Deployed');
  }
};

// The latest pull request, build and deployment as one row of chips: what a
// reader asks first, before opening the Code and Delivery groups.
export const DevelopmentSummaryChips = ({
  summary,
}: DevelopmentSummaryChipsProps) => {
  const pullRequest =
    summary.pullRequest === null
      ? null
      : readPullRequestChip(summary.pullRequest.status);
  const build =
    summary.build === null ? null : readBuildChip(summary.build.status);

  return (
    <span
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        minWidth: 0,
      }}
    >
      {pullRequest !== null && (
        <DevelopmentChip
          label={pullRequest.label}
          color={pullRequest.color}
          Icon={IconArrowMerge}
        />
      )}
      {build !== null && (
        <DevelopmentChip
          label={build.label}
          color={build.color}
          Icon={build.Icon}
        />
      )}
      {summary.deployment !== null && (
        <DevelopmentChip
          label={readEnvironmentLabel(summary.deployment)}
          color={summary.deployment.status === 'FAILED' ? 'red' : 'sky'}
          Icon={IconRocket}
        />
      )}
    </span>
  );
};

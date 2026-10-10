import { DEVELOPMENT_DELIVERY_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type DevelopmentDeliveryRow } from '../../types/development-delivery';
import { type IssueDevelopmentSummary } from '../../types/issue-development-summary';
import { summarizeDevelopmentDeliveries } from '../../utils/summarize-development-deliveries.util';
import { listScopedRecords } from './list-scoped-records.util';

type Link = { issueId: string; linkType: string; status: string | null };
export const attachDevelopmentSummaries = async <TIssue extends { id: string }>(
  client: ApiClient,
  issues: TIssue[],
): Promise<(TIssue & { developmentSummary: IssueDevelopmentSummary })[]> => {
  if (issues.length === 0) return [];
  const filter = { issueId: { in: issues.map((issue) => issue.id) } };
  const [links, deliveries] = await Promise.all([
    listScopedRecords<Link>({
      client,
      pluralName: 'developmentLinks',
      filter,
      selection: { issueId: true, linkType: true, status: true },
    }),
    listScopedRecords<DevelopmentDeliveryRow>({
      client,
      pluralName: 'developmentDeliveries',
      filter,
      selection: DEVELOPMENT_DELIVERY_SELECTION,
    }),
  ]);
  return issues.map((issue) => {
    const issueLinks = links.filter((link) => link.issueId === issue.id);
    const { builds, environments } = summarizeDevelopmentDeliveries(
      deliveries.filter((delivery) => delivery.issueId === issue.id),
    );
    return {
      ...issue,
      developmentSummary: {
        branchCount: issueLinks.filter(
          (link) => link.linkType === 'BRANCH' && link.status !== 'DELETED',
        ).length,
        commitCount: issueLinks.filter((link) => link.linkType === 'COMMIT')
          .length,
        openPullRequestCount: issueLinks.filter(
          (link) =>
            link.linkType === 'PULL_REQUEST' &&
            ['OPEN', 'DRAFT'].includes(link.status ?? ''),
        ).length,
        mergedPullRequestCount: issueLinks.filter(
          (link) =>
            link.linkType === 'PULL_REQUEST' && link.status === 'MERGED',
        ).length,
        failedBuildCount: builds.filter((build) => build.status === 'FAILED')
          .length,
        successfulProductionDeploymentCount: environments.filter(
          (deployment) =>
            deployment.environmentType === 'PRODUCTION' &&
            deployment.status === 'SUCCESSFUL',
        ).length,
        failedDeploymentCount: environments.filter(
          (deployment) => deployment.status === 'FAILED',
        ).length,
      },
    };
  });
};

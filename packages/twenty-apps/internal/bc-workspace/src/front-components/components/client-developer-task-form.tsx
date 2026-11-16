import { useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { Banner } from 'twenty-ui/primitives/feedback';

import {
  DEV_TASK_LINK_ROUTE_PATH,
  DEV_TASK_PROJECTS_ROUTE_PATH,
  TASK_MANAGER_CREATE_ISSUE_ROUTE_PATH,
} from '../../constants/route-paths';
import {
  type ClientAppEntry,
  type ClientIssueItem,
  type DeveloperProject,
} from '../../types/dashboard';
import { openDeveloperIssue } from '../utils/client-navigation.util';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { BcSelect } from './bc-select';
import { BcField, BcTextArea, BcTextInput } from './bc-text-input';
import { ClientFormShell } from './client-forms';

const NO_ISSUE_VALUE = 'NONE';

type CreatedIssue = { id: string; title?: string | null; issueKey?: string | null };

const buildDescription = ({
  details,
  clientName,
  shopDomain,
  issue,
}: {
  details: string;
  clientName: string;
  shopDomain: string | null;
  issue: ClientIssueItem | undefined;
}): string =>
  [
    details.trim(),
    '',
    `**Client:** ${clientName}${shopDomain === null ? '' : ` (${shopDomain})`}`,
    ...(issue === undefined
      ? []
      : [
          `**Client issue:** ${issue.title}`,
          ...issue.evidence
            .slice(0, 3)
            .map((evidence) =>
              evidence.url === null ? `> ${evidence.excerpt}` : `> ${evidence.excerpt} ([source](${evidence.url}))`,
            ),
        ]),
  ]
    .join('\n')
    .trim();

// Files the ticket through Task Manager's own create route, so key
// allocation, merchant links, App access checks and notifications apply as
// for any other developer task.
export const ClientDeveloperTaskForm = ({
  vipClientId,
  clientName,
  shopDomain,
  apps,
  openIssues,
  onDone,
  onCancel,
}: {
  vipClientId: string;
  clientName: string;
  shopDomain: string | null;
  apps: ClientAppEntry[];
  openIssues: ClientIssueItem[];
  onDone: () => void;
  onCancel: () => void;
}) => {
  const [merchantId, setMerchantId] = useState(apps[0]?.merchantId ?? '');
  const [projects, setProjects] = useState<DeveloperProject[] | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState('');
  const [issueType, setIssueType] = useState('BUG');
  const [bcIssueId, setBcIssueId] = useState(openIssues[0]?.id ?? NO_ISSUE_VALUE);
  const [title, setTitle] = useState(openIssues[0]?.title ?? '');
  const [details, setDetails] = useState(openIssues[0]?.summary ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const app = apps.find((candidate) => candidate.merchantId === merchantId);
  const appName = app?.appName ?? null;

  useEffect(() => {
    let isCurrent = true;

    setProjects(null);
    setProjectsError(null);
    postAppRoute<{ success: true; projects: DeveloperProject[] }>(DEV_TASK_PROJECTS_ROUTE_PATH, {
      appName,
    })
      .then((result) => {
        if (isCurrent) {
          setProjects(result.projects);
          setProjectId(result.projects[0]?.id ?? '');
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setProjectsError(readErrorText(error));
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [appName]);

  const submit = async () => {
    const project = projects?.find((candidate) => candidate.id === projectId);

    if (project === undefined) {
      return;
    }

    setIsSaving(true);

    try {
      const linkedIssue = openIssues.find((issue) => issue.id === bcIssueId);
      const created = await postAppRoute<{ success: true; issue: CreatedIssue }>(
        TASK_MANAGER_CREATE_ISSUE_ROUTE_PATH,
        {
          projectId: project.id,
          merchantIds: merchantId.length > 0 ? [merchantId] : [],
          data: {
            title: title.trim(),
            issueType,
            statusId: project.defaultStatusId,
            description: {
              markdown: buildDescription({ details, clientName, shopDomain, issue: linkedIssue }),
            },
          },
        },
      );

      await postAppRoute(DEV_TASK_LINK_ROUTE_PATH, {
        vipClientId,
        issueId: created.issue.id,
        appName,
        bcIssueId: linkedIssue?.id ?? null,
      });
      void enqueueSnackbar({
        message: t('Developer task {key} created', { key: created.issue.issueKey ?? '' }),
        variant: 'success',
      });
      onDone();
      openDeveloperIssue(created.issue.id);
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ClientFormShell
      title={t('Create developer task')}
      submitLabel={t('Create in Task Manager')}
      isSaving={isSaving}
      isSubmitDisabled={projectId.length === 0 || title.trim().length === 0}
      onCancel={onCancel}
      onSubmit={() => void submit()}
    >
      {apps.length > 0 && (
        <BcField label={t('App')}>
          <BcSelect
            ariaLabel={t('App')}
            value={merchantId}
            onChange={setMerchantId}
            options={apps.map((candidate) => ({
              value: candidate.merchantId,
              label: candidate.appName,
            }))}
          />
        </BcField>
      )}
      {projectsError !== null ? (
        <Banner color="danger" variant="secondary">
          {projectsError}
        </Banner>
      ) : (
        <BcField label={t('Project')} isRequired>
          <BcSelect
            ariaLabel={t('Project')}
            value={projectId}
            isDisabled={projects === null || projects.length === 0}
            onChange={setProjectId}
            menuWidth={300}
            options={(projects ?? []).map((project) => ({
              value: project.id,
              label: project.key === null ? project.name : `${project.key} · ${project.name}`,
              description: project.appName ?? undefined,
            }))}
          />
        </BcField>
      )}
      <BcField label={t('Type')}>
        <BcSelect
          ariaLabel={t('Type')}
          value={issueType}
          onChange={setIssueType}
          options={[
            { value: 'BUG', label: t('Bug') },
            { value: 'TASK', label: t('Task') },
            { value: 'STORY', label: t('Story') },
          ]}
        />
      </BcField>
      {openIssues.length > 0 && (
        <BcField label={t('Client issue')}>
          <BcSelect
            ariaLabel={t('Client issue')}
            value={bcIssueId}
            onChange={(value) => {
              setBcIssueId(value);

              const issue = openIssues.find((candidate) => candidate.id === value);

              if (issue !== undefined && title.trim().length === 0) {
                setTitle(issue.title);
              }
            }}
            menuWidth={300}
            options={[
              { value: NO_ISSUE_VALUE, label: t('Not linked to an issue') },
              ...openIssues.map((issue) => ({ value: issue.id, label: issue.title })),
            ]}
          />
        </BcField>
      )}
      <BcField label={t('Title')} isRequired>
        <BcTextInput value={title} onChange={setTitle} ariaLabel={t('Title')} maxLength={200} />
      </BcField>
      <BcField
        label={t('Description')}
        hint={t('The client, domain and issue evidence are added for the developer.')}
      >
        <BcTextArea value={details} onChange={setDetails} ariaLabel={t('Description')} maxLength={5000} />
      </BcField>
    </ClientFormShell>
  );
};

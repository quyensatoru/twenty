import type { GitProviderName } from '../logic-functions/utils/git-api.util';
import type { DevelopmentReferenceInput } from './normalize-development-reference.util';

// Provider webhook events, normalized to the references the upsert understands.
// Only events carrying an issue key downstream survive: anything without one
// is returned with empty issueKeys and skipped by the caller.
export type ParsedGitWebhook = {
  repoSlug: string | null;
  repoExternalId: string | null;
  references: DevelopmentReferenceInput[];
  ignoredEvent: string | null;
};

type GitHubEvent = {
  eventName: string;
  payload: Record<string, unknown>;
};

type GitLabEvent = {
  objectKind: string;
  payload: Record<string, unknown>;
};

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

const readRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const parseGitWebhook = ({
  provider,
  eventName,
  headers,
  payload,
}: {
  provider: GitProviderName;
  eventName: string | null;
  headers: Record<string, string | undefined>;
  payload: unknown;
}): ParsedGitWebhook => {
  const body = readRecord(payload);

  if (provider === 'github') {
    return parseGitHubWebhook({ eventName: eventName ?? '', payload: body });
  }

  return parseGitLabWebhook({
    objectKind:
      readString(body.object_kind) ??
      readString(headers['x-gitlab-event']) ??
      '',
    payload: body,
  });
};

const emptyResult = (ignoredEvent: string): ParsedGitWebhook => ({
  repoSlug: null,
  repoExternalId: null,
  references: [],
  ignoredEvent,
});

// GitHub identifies the event in `X-GitHub-Event` (push, pull_request, ping…)
// and the repo in `repository.full_name`.
const parseGitHubWebhook = ({
  eventName,
  payload,
}: GitHubEvent): ParsedGitWebhook => {
  const repository = readRecord(payload.repository);
  const repoSlug = readString(repository.full_name)?.toLowerCase() ?? null;
  const repoExternalId =
    typeof repository.id === 'number' ? String(repository.id) : null;

  if (eventName === 'ping') {
    return { ...emptyResult('ping'), repoSlug, repoExternalId };
  }

  if (eventName === 'push') {
    const commits = Array.isArray(payload.commits) ? payload.commits : [];

    return {
      repoSlug,
      repoExternalId,
      ignoredEvent: null,
      references: [
        ...parsePushBranch(
          payload,
          readString(repository.html_url),
          payload.deleted === true,
        ),
        ...commits.map((commit) => {
          const row = readRecord(commit);
          const author = readRecord(row.author);

          return {
            kind: 'commit',
            title: readString(row.message),
            url: readString(row.url),
            externalId: readString(row.id),
            authorName:
              readString(author.name) ?? readString(author.username) ?? null,
          };
        }),
      ],
    };
  }

  if (
    (eventName === 'create' || eventName === 'delete') &&
    payload.ref_type === 'branch'
  ) {
    return {
      repoSlug,
      repoExternalId,
      ignoredEvent: null,
      references: parsePushBranch(
        { ref: `refs/heads/${payload.ref}` },
        readString(repository.html_url),
        eventName === 'delete',
      ),
    };
  }

  if (eventName === 'pull_request') {
    const pull = readRecord(payload.pull_request);
    const head = readRecord(pull.head);
    const user = readRecord(pull.user);

    return {
      repoSlug,
      repoExternalId,
      ignoredEvent: null,
      references: [
        {
          kind: 'pull-request',
          title: readString(pull.title),
          url: readString(pull.html_url),
          status:
            pull.merged === true
              ? 'MERGED'
              : pull.state === 'open'
                ? pull.draft === true
                  ? 'DRAFT'
                  : 'OPEN'
                : 'CLOSED',
          externalId:
            typeof pull.number === 'number' ? String(pull.number) : null,
          authorName: readString(user.login),
          text: readString(head.ref),
        },
      ],
    };
  }

  return { ...emptyResult(eventName), repoSlug, repoExternalId };
};

// GitLab puts the event in `object_kind` (push, merge_request…) with the
// project in `project.path_with_namespace`.
const parseGitLabWebhook = ({
  objectKind,
  payload,
}: GitLabEvent): ParsedGitWebhook => {
  const project = readRecord(payload.project);
  const repoSlug =
    readString(project.path_with_namespace)?.toLowerCase() ?? null;
  const repoExternalId =
    typeof project.id === 'number' ? String(project.id) : null;

  if (objectKind === 'push') {
    const commits = Array.isArray(payload.commits) ? payload.commits : [];

    return {
      repoSlug,
      repoExternalId,
      ignoredEvent: null,
      references: [
        ...parsePushBranch(
          payload,
          readString(project.web_url),
          payload.after === '0000000000000000000000000000000000000000',
          true,
        ),
        ...commits.map((commit) => {
          const row = readRecord(commit);
          const author = readRecord(row.author);

          return {
            kind: 'commit',
            title: readString(row.message),
            url: readString(row.url),
            externalId: readString(row.id),
            authorName: readString(author.name) ?? null,
          };
        }),
      ],
    };
  }

  if (objectKind === 'merge_request') {
    const attributes = readRecord(payload.object_attributes);
    const state = readString(attributes.state);

    return {
      repoSlug,
      repoExternalId,
      ignoredEvent: null,
      references: [
        {
          kind: 'pull-request',
          title: readString(attributes.title),
          url: readString(attributes.url),
          status:
            state === 'merged'
              ? 'MERGED'
              : state === 'opened'
                ? attributes.draft === true ||
                  attributes.work_in_progress === true
                  ? 'DRAFT'
                  : 'OPEN'
                : 'CLOSED',
          externalId:
            typeof attributes.iid === 'number' ? String(attributes.iid) : null,
          text: readString(attributes.source_branch),
        },
      ],
    };
  }

  return { ...emptyResult(objectKind), repoSlug, repoExternalId };
};

const parsePushBranch = (
  payload: Record<string, unknown>,
  remoteUrl: string | null,
  deleted: boolean,
  isGitLab = false,
): DevelopmentReferenceInput[] => {
  const ref = readString(payload.ref);
  if (ref === null || !ref.startsWith('refs/heads/')) return [];
  const name = ref.slice('refs/heads/'.length);
  return [
    {
      kind: 'branch',
      title: name,
      externalId: name,
      status: deleted ? 'DELETED' : 'ACTIVE',
      url:
        remoteUrl === null
          ? null
          : `${remoteUrl}/${isGitLab ? '-/tree' : 'tree'}/${encodeURIComponent(name)}`,
    },
  ];
};

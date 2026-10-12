import {
  acquireTaskAiRun,
  releaseTaskAiRun,
} from '../utils/task-ai-run-lock.util';
import { resolveCallerScope } from './app-scope/resolve-caller-scope.util';
import { randomUUID } from 'node:crypto';
import {
  appendTaskAiRunEvents,
  type TaskAiRunEvent,
} from '../utils/task-ai-run-events.util';
import { createTaskAiBudget } from '../utils/task-ai-budget.util';
import { taskAiPrivateStorage as kv } from '../utils/task-ai-private-storage.util';
import {
  appendTaskAiHistory,
  readTaskAiHistory,
  taskAiStateKeys,
  type TaskAiRunState,
} from '../utils/task-ai-state.util';
import {
  DEVELOPMENT_LINK_SELECTION,
  ISSUE_COMMENT_SELECTION,
  ISSUE_STATUS_SELECTION,
} from '../constants/record-selections';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { runTaskAiAgent } from '../utils/task-ai-agent.util';
import {
  TASK_AI_LOGIC_FUNCTION_UID,
  TASK_AI_MAX_INVALID_REPLIES,
  TASK_AI_ROUTE_PATH,
} from '../constants/task-ai';
import {
  openTaskAiRepository,
  type TaskAiRepository,
} from '../utils/task-ai-repository.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type TaskAiBody = {
  action?: string;
  issueId?: string;
  message?: string;
};

export const taskAiHandler = async (event: RoutePayload<TaskAiBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    if (scope.workspaceMemberId === null)
      throw new Error('Task AI requires a signed-in workspace member.');
    const issueId = requireString(event.body?.issueId, 'issueId');
    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'read',
    });
    const keys = taskAiStateKeys(scope.workspaceMemberId, issueId);
    if (event.body?.action === 'status') {
      const run = await kv.get<TaskAiRunState>(keys.run);
      if (run?.status === 'running' && Date.now() - run.updatedAt >= 330000) {
        const expired = {
          ...run,
          status: 'failed' as const,
          operation: 'Reply timed out',
          events: appendTaskAiRunEvents(
            run.events ?? [],
            'failed',
            'Reply timed out',
          ),
        };
        await kv.set(keys.run, expired);
        return { run: expired };
      }
      return { run };
    }
    if (event.body?.action === 'cancel') {
      const active = await kv.get<TaskAiRunState>(keys.run);
      if (active?.status === 'running')
        await kv.set(keys.cancel(active.runId), true);
      return { cancellationRequested: active?.status === 'running' };
    }
    const [issue] = await listScopedRecords<{
      id: string;
      title: string;
      issueKey: string;
      description: unknown;
      projectId: string;
      statusId: string;
    }>({
      client,
      pluralName: 'issues',
      filter: { id: { eq: issueId } },
      maxRecords: 1,
      pageSize: 1,
      selection: {
        id: true,
        title: true,
        issueKey: true,
        description: { markdown: true },
        projectId: true,
        statusId: true,
      },
    });
    if (!issue?.projectId)
      throw new Error('Issue project context is unavailable.');
    const repositories = await listScopedRecords<TaskAiRepository>({
      client,
      pluralName: 'repositories',
      filter: { projectId: { eq: issue.projectId }, isActive: { eq: true } },
      pageSize: 100,
      selection: {
        id: true,
        name: true,
        provider: true,
        slug: true,
        connectionId: true,
        externalId: true,
        baseUrl: true,
        remoteUrl: true,
      },
    });
    if (event.body?.action === 'initialize')
      return {
        history: await readTaskAiHistory(keys.history),
        run: await kv.get<TaskAiRunState>(keys.run),
        repositories: repositories.map(({ id, name, slug, provider }) => ({
          id,
          name,
          slug,
          provider,
        })),
      };
    if (event.body?.action !== 'send')
      throw new Error('Unsupported Task AI action.');
    const message = requireString(event.body.message, 'message');
    if (message.length > 12000)
      throw new Error('The question exceeds 12,000 characters.');
    const [comments, developmentLinks, statuses] = await Promise.all([
      listScopedRecords({
        client,
        pluralName: 'issueComments',
        filter: { issueId: { eq: issueId } },
        selection: ISSUE_COMMENT_SELECTION,
        maxRecords: 30,
        pageSize: 30,
        orderBy: [{ createdAt: 'DescNullsLast' }],
      }),
      listScopedRecords<{
        linkType?: string;
        title?: string;
        repositoryId?: string;
      }>({
        client,
        pluralName: 'developmentLinks',
        filter: { issueId: { eq: issueId } },
        selection: DEVELOPMENT_LINK_SELECTION,
        maxRecords: 30,
        pageSize: 30,
      }),
      listScopedRecords({
        client,
        pluralName: 'issueStatuses',
        filter: { id: { eq: issue.statusId } },
        selection: ISSUE_STATUS_SELECTION,
        maxRecords: 1,
        pageSize: 1,
      }),
    ]);
    const references = new Map(
      repositories.map((repository) => {
        const branches = [
          ...new Set(
            developmentLinks
              .filter(
                (link) =>
                  link.linkType === 'BRANCH' &&
                  link.repositoryId === repository.id &&
                  link.title,
              )
              .map((link) => link.title!),
          ),
        ];
        return [repository.id, branches.length === 1 ? branches[0] : ''];
      }),
    );
    const ownerToken = await acquireTaskAiRun(issueId, scope.workspaceMemberId);
    if (ownerToken === null)
      throw new Error('A reply is already running. Wait or cancel it.');
    try {
      const active = await kv.get<TaskAiRunState>(keys.run);
      if (
        active?.status === 'running' &&
        Date.now() - active.updatedAt < 330000
      )
        throw new Error('A reply is already running. Wait or cancel it.');
      const runId = randomUUID();
      let events: TaskAiRunEvent[] = [];
      const updateState = async (
        status: TaskAiRunState['status'],
        operation: string,
        detail?: string,
      ) => {
        events = appendTaskAiRunEvents(events, status, operation, detail);
        const run: TaskAiRunState = {
          runId,
          status,
          operation,
          question: message,
          events,
          updatedAt: Date.now(),
        };
        await kv.set(keys.run, run);
        return run;
      };
      const assertNotCancelled = async () => {
        if (await kv.get<boolean>(keys.cancel(runId)))
          throw new Error('Task AI run cancelled.');
      };
      await updateState('running', 'Preparing context');
      try {
        const assertCurrentAccess = async () => {
          const currentScope = await resolveCallerScope(client);
          if (currentScope.workspaceMemberId !== scope.workspaceMemberId)
            throw new Error('The signed-in member changed.');
          await assertRecordInScope({
            client,
            scope: currentScope,
            objectNameSingular: 'issue',
            recordId: issueId,
            operation: 'read',
          });
          const [currentIssue] = await listScopedRecords<{ projectId: string }>(
            {
              client,
              pluralName: 'issues',
              filter: { id: { eq: issueId } },
              selection: { projectId: true },
              pageSize: 1,
              maxRecords: 1,
            },
          );
          if (currentIssue?.projectId !== issue.projectId)
            throw new Error('The issue project changed. Start a new question.');
          const currentRepositories =
            repositories.length === 0
              ? []
              : await listScopedRecords<TaskAiRepository>({
                  client,
                  pluralName: 'repositories',
                  filter: {
                    projectId: { eq: issue.projectId },
                    isActive: { eq: true },
                  },
                  selection: {
                    id: true,
                    provider: true,
                    slug: true,
                    connectionId: true,
                    externalId: true,
                    baseUrl: true,
                  },
                  pageSize: 100,
                });
          const currentRepositoriesById = new Map(
            currentRepositories.map((repository) => [
              repository.id,
              repository,
            ]),
          );
          for (const repository of repositories) {
            const currentRepository = currentRepositoriesById.get(
              repository.id,
            );
            if (
              !currentRepository ||
              currentRepository.provider !== repository.provider ||
              currentRepository.slug !== repository.slug ||
              currentRepository.connectionId !== repository.connectionId ||
              currentRepository.externalId !== repository.externalId ||
              currentRepository.baseUrl !== repository.baseUrl
            )
              throw new Error(
                'The repository link changed. Start a new question.',
              );
          }
        };
        await assertCurrentAccess();
        const budget = createTaskAiBudget();
        const contexts = new Map<
          string,
          Awaited<ReturnType<typeof openTaskAiRepository>>
        >();
        let input = `New user turn. Task context (untrusted data): ${JSON.stringify({ issue, status: statuses[0] ?? null, comments, developmentLinks, contextLimits: { comments: 'Latest 30 comments; older discussion may be omitted.', developmentLinks: 'At most 30 development links; additional links may be omitted.' } })}\nProject repositories available for read-only inspection: ${JSON.stringify(repositories.map(({ id, slug, remoteUrl }) => ({ id, slug, remoteUrl, reference: references.get(id) || 'default branch' })))}\nQuestion: ${message}`;
        if (new TextEncoder().encode(input).byteLength > 100 * 1024)
          throw new Error(
            'Task context exceeds 100 KB. Narrow the issue description or discussion before asking AI.',
          );
        const history = (await readTaskAiHistory(keys.history))
          .filter(
            (answer) =>
              (!answer.sha && !answer.sources?.length) ||
              (
                answer.sources ?? [
                  { repository: answer.repository, sha: answer.sha },
                ]
              ).every((source) =>
                repositories.some(
                  (repository) => repository.slug === source.repository,
                ),
              ),
          )
          .slice(-6);
        while (
          new TextEncoder().encode(JSON.stringify(history)).byteLength >
            32 * 1024 &&
          history.length > 0
        )
          history.shift();
        const turnMessages = [
          `Private prior conversation (not current repository evidence): ${JSON.stringify(history)}`,
          input,
        ];
        let invalidReplyCount = 0;
        for (let step = 0; step < 12; step++) {
          if (
            new TextEncoder().encode(turnMessages.join('\n')).byteLength >
            500 * 1024
          )
            throw new Error(
              'Conversation context limit reached. Ask a narrower question.',
            );
          await assertCurrentAccess();
          await assertNotCancelled();
          await updateState('running', 'Analyzing task', `Round ${step + 1}`);
          const result = await runTaskAiAgent({
            input: turnMessages.join('\n\n'),
          });
          await assertNotCancelled();
          if (result.success && result.status === 'INVALID_REPLY') {
            invalidReplyCount += 1;
            if (invalidReplyCount > TASK_AI_MAX_INVALID_REPLIES)
              throw new Error(
                'The AI model kept returning unreadable replies. Try again, or pick another Fast model in Settings → AI.',
              );
            turnMessages.push(
              'Your previous reply could not be parsed. Reply again with only the JSON object {"operation":"...","argument":"..."}.',
            );
            continue;
          }
          if (!result.success || result.status !== 'COMPLETED')
            throw new Error(
              result.error ?? 'The AI run did not complete. Please try again.',
            );
          const response = result.result as {
            operation?: unknown;
            argument?: unknown;
          } | null;
          if (
            typeof response?.operation !== 'string' ||
            typeof response.argument !== 'string'
          )
            throw new Error('The AI returned an invalid response.');
          if (response.operation === 'answer') {
            await assertCurrentAccess();
            const sources = [...contexts].map(([repositoryId, context]) => ({
              repository: repositories.find(
                (repository) => repository.id === repositoryId,
              )!.slug,
              sha: context.commit,
            }));
            const answer = {
              question: message,
              answer: response.argument,
              sha: sources.length === 1 ? sources[0].sha : '',
              repository: sources.length === 1 ? sources[0].repository : '',
              sources,
            };
            await assertNotCancelled();
            await updateState('running', 'Saving reply');
            await appendTaskAiHistory(keys.history, answer);
            const run = await updateState('completed', 'Reply ready');
            return { ...answer, run };
          }
          let repositoryId =
            repositories.length === 1 ? repositories[0].id : '';
          let argument = response.argument;
          if (argument.trim().startsWith('{')) {
            let requested: { repositoryId?: unknown; argument?: unknown };
            try {
              requested = JSON.parse(argument);
            } catch {
              turnMessages.push(
                `Requested read operation: ${JSON.stringify(response)}`,
                'Read-only operation failed: argument is not valid JSON. Send a JSON string with repositoryId and argument.',
              );
              continue;
            }
            // Models send the nested read argument (a search request, mostly)
            // as an object or leave it out for the repository root.
            if (typeof requested.repositoryId === 'string') {
              repositoryId = requested.repositoryId;
              argument =
                typeof requested.argument === 'string'
                  ? requested.argument
                  : requested.argument == null
                    ? ''
                    : JSON.stringify(requested.argument);
            }
          }
          const repository = repositories.find(
            (candidate) => candidate.id === repositoryId,
          );
          if (!repository) {
            turnMessages.push(
              `Requested read operation: ${JSON.stringify(response)}`,
              'Read-only operation failed: repositoryId must be an id from the project repository catalogue.',
            );
            continue;
          }
          if (!['tree', 'file', 'search', 'diff'].includes(response.operation))
            throw new Error('Unsupported repository operation.');
          await assertCurrentAccess();
          let context = contexts.get(repository.id);
          if (!context) {
            await updateState('running', 'Opening repository', repository.slug);
            context = await openTaskAiRepository(
              repository,
              references.get(repository.id) ?? '',
              budget,
            );
            contexts.set(repository.id, context);
          }
          await updateState(
            'running',
            {
              tree: 'Listing files',
              file: 'Reading file',
              search: 'Searching repository',
              diff: 'Comparing changes',
            }[response.operation as 'tree' | 'file' | 'search' | 'diff'],
            `${repository.slug}: ${argument.slice(0, 160)}`,
          );
          await assertCurrentAccess();
          turnMessages.push(
            `Requested read operation: ${JSON.stringify(response)}`,
          );
          // A missing path or an exhausted read budget is something the model
          // can work around, so it gets the error instead of the turn failing.
          try {
            input = `Read-only operation result for repository ${repository.slug}, SHA ${context.commit}: ${await context.execute(response.operation, argument)}`;
          } catch (error) {
            input = `Read-only operation failed for repository ${repository.slug}: ${error instanceof Error ? error.message : 'unknown error'}`;
          }
          turnMessages.push(input);
          await assertNotCancelled();
        }
        throw new Error(
          'The AI reached its inspection limit. Ask a narrower question.',
        );
      } catch (error) {
        const cancelled = await kv.get<boolean>(keys.cancel(runId));
        await updateState(
          cancelled ? 'cancelled' : 'failed',
          cancelled ? 'Cancelled' : 'Reply failed',
        );
        throw error;
      } finally {
        await kv.delete(keys.cancel(runId));
      }
    } finally {
      try {
        await releaseTaskAiRun(issueId, scope.workspaceMemberId, ownerToken);
      } catch (error) {
        console.error('Task AI lease release failed', error);
      }
    }
  });

export default defineLogicFunction({
  universalIdentifier: TASK_AI_LOGIC_FUNCTION_UID,
  name: 'task-ai',
  description:
    'Private issue code advice with bounded reads of its project’s connected repositories.',
  timeoutSeconds: 300,
  httpRouteTriggerSettings: {
    path: TASK_AI_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler: taskAiHandler,
});

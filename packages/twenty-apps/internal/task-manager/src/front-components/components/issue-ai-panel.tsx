import { isNull } from '@sniptt/guards';
import { useEffect, useRef, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { IconSparkles, IconCode, IconSend } from 'twenty-ui/icon';
import { getTaskControlStyle } from './task-control-styles';
import { t } from 'twenty-sdk/front-component';
import { TASK_AI_ROUTE_PATH } from '../../constants/task-ai';
import { CREATE_ISSUE_COMMENT_ROUTE_PATH } from '../../constants/route-paths';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { type TaskAiRunState } from '../../utils/task-ai-state.util';
import {
  mergeTaskAiRunEvents,
  type TaskAiRunEvent,
} from '../../utils/task-ai-run-events.util';
import { TaskAiRunTimeline } from './task-ai-run-timeline';
import { TaskButton } from './task-button';
import { TaskRichTextPreview } from './task-rich-text-preview';
import { TASK_TOKENS } from './task-tokens';
import { buildRichTextValue } from '../../utils/read-rich-text-plain-value.util';
import { resolveTaskAiCitationLinks } from '../../utils/resolve-task-ai-citation-links.util';

type IssueAiPanelProps = { issueId: string };
type RepositoryChoice = {
  id: string;
  name: string | null;
  slug: string;
  provider: string;
  remoteUrl?: string | null;
};
type Answer = {
  question: string;
  answer: string;
  sha: string;
  repository: string;
  sources?: { repository: string; sha: string }[];
};

export const IssueAiPanel = ({ issueId }: IssueAiPanelProps) => {
  const [repositories, setRepositories] = useState<RepositoryChoice[] | null>(
    null,
  );
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [draftKey, setDraftKey] = useState(0);
  const [question, setQuestion] = useState('');
  const [draftSeed, setDraftSeed] = useState('');
  const questionInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const input = questionInput.current;
    if (input === null) return;
    // defaultValue does not seed the sandbox value React reads for selection restoration.
    input.value = draftSeed;
    if (draftSeed.length > 0) {
      input.focus();
      input.setSelectionRange(draftSeed.length, draftSeed.length);
    }
  }, [draftKey, repositories]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [preview, setPreview] = useState<Answer | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);
  const generation = useRef(0);
  const shareRequestId = useRef('');
  const restoredPolling = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      generation.current += 1;
      if (restoredPolling.current !== null)
        clearInterval(restoredPolling.current);
    },
    [],
  );
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [activity, setActivity] = useState<{
    runId: string;
    events: TaskAiRunEvent[];
  }>({ runId: '', events: [] });
  const receiveRun = (run?: TaskAiRunState | null) => {
    if (run === undefined || isNull(run)) return;
    setProgress(run.operation);
    setActivity((previous) => ({
      runId: run.runId,
      events:
        previous.runId === run.runId
          ? mergeTaskAiRunEvents(previous.events, run.events ?? [])
          : (run.events ?? []),
    }));
  };
  const [isSending, setIsSending] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const initialize = async () => {
    const requestGeneration = generation.current;
    let hasActiveRun = false;
    setIsBusy(true);
    setError('');
    try {
      const result = await postAppRoute<{
        success: true;
        repositories: RepositoryChoice[];
        history?: Answer[];
        run?: TaskAiRunState | null;
      }>(TASK_AI_ROUTE_PATH, { action: 'initialize', issueId });
      if (requestGeneration !== generation.current) return;
      setRepositories(result.repositories);
      try {
        const configuration = await new RestApiClient().get<{
          aiModels?: unknown[];
        }>('/client-config');
        if (requestGeneration !== generation.current) return;
        setIsAvailable(
          configuration.aiModels ? configuration.aiModels.length > 0 : null,
        );
      } catch {
        if (requestGeneration === generation.current) setIsAvailable(null);
      }
      if (requestGeneration !== generation.current) return;
      setAnswers(result.history ?? []);
      receiveRun(result.run);
      setPendingQuestion(
        result.run?.status === 'running' ? (result.run.question ?? null) : null,
      );
      if (
        result.run?.status === 'running' &&
        Date.now() - result.run.updatedAt < 330000
      ) {
        hasActiveRun = true;
        setIsSending(true);
        setProgress(result.run.operation);
        if (restoredPolling.current !== null)
          clearInterval(restoredPolling.current);
        restoredPolling.current = setInterval(() => {
          void postAppRoute<{
            success: true;
            run?: TaskAiRunState | null;
          }>(TASK_AI_ROUTE_PATH, { action: 'status', issueId })
            .then((status) => {
              if (requestGeneration !== generation.current) return;
              receiveRun(status.run);
              if (status.run?.status !== 'running') {
                if (restoredPolling.current !== null)
                  clearInterval(restoredPolling.current);
                restoredPolling.current = null;
                setIsSending(false);
                setIsBusy(false);
                void initialize();
              }
            })
            .catch((failure) => {
              if (requestGeneration === generation.current)
                setError(readErrorText(failure));
            });
        }, 1500);
      }
    } catch (failure) {
      if (requestGeneration === generation.current)
        setError(readErrorText(failure));
    } finally {
      if (requestGeneration === generation.current) setIsBusy(hasActiveRun);
    }
  };
  const send = async () => {
    const requestGeneration = ++generation.current;
    const sentQuestion = question.trim();
    const previousRunId = activity.runId;
    setActivity({ runId: '', events: [] });
    setIsSending(true);
    setCancelRequested(false);
    setPendingQuestion(sentQuestion);
    setProgress(t('Preparing advice…'));
    const polling = setInterval(() => {
      void postAppRoute<{ success: true; run?: TaskAiRunState | null }>(
        TASK_AI_ROUTE_PATH,
        { action: 'status', issueId },
      )
        .then((result) => {
          if (
            requestGeneration === generation.current &&
            result.run?.runId !== previousRunId
          )
            receiveRun(result.run);
        })
        .catch(() => {});
    }, 1500);
    restoredPolling.current = polling;
    setIsBusy(true);
    setError('');
    setDraftSeed('');
    setQuestion('');
    setDraftKey((previous) => previous + 1);
    try {
      const result = await postAppRoute<{
        success: true;
        answer: string;
        sha: string;
        repository: string;
        sources?: { repository: string; sha: string }[];
        run?: TaskAiRunState | null;
      }>(TASK_AI_ROUTE_PATH, {
        action: 'send',
        issueId,
        message: sentQuestion,
      });
      if (requestGeneration === generation.current) {
        receiveRun(result.run);
        setAnswers((previous) => [
          ...previous,
          {
            question: sentQuestion,
            answer: result.answer,
            sha: result.sha,
            repository: result.repository,
            sources: result.sources,
          },
        ]);
      }
    } catch (failure) {
      if (requestGeneration === generation.current) {
        setError(readErrorText(failure));
        try {
          const status = await postAppRoute<{
            success: true;
            run?: TaskAiRunState | null;
          }>(TASK_AI_ROUTE_PATH, { action: 'status', issueId });
          if (
            requestGeneration === generation.current &&
            status.run?.runId !== previousRunId
          )
            receiveRun(status.run);
        } catch {}
        if (requestGeneration !== generation.current) return;
        setDraftSeed(sentQuestion);
        setQuestion(sentQuestion);
        setDraftKey((previous) => previous + 1);
      }
    } finally {
      clearInterval(polling);
      if (restoredPolling.current === polling) restoredPolling.current = null;
      if (requestGeneration === generation.current) {
        setIsSending(false);
        setIsBusy(false);
        setPendingQuestion(null);
      }
    }
  };
  const share = async () => {
    if (preview === null) return;
    setIsBusy(true);
    setError('');
    // Answers saved before citations were resolved still hold relative links.
    const content = resolveTaskAiCitationLinks(
      formatAnswer(preview),
      (repositories ?? []).map((repository) => ({
        ...repository,
        remoteUrl: repository.remoteUrl ?? null,
      })),
    );
    const markdown = `**${t('AI-assisted')}**\n\n${content}`;
    try {
      await postAppRoute(CREATE_ISSUE_COMMENT_ROUTE_PATH, {
        issueId,
        requestId: shareRequestId.current,
        bodyV2: buildRichTextValue(markdown),
      });
      setPreview(null);
      setShared(true);
    } catch (failure) {
      setError(readErrorText(failure));
    } finally {
      setIsBusy(false);
    }
  };
  useEffect(() => {
    void initialize();
  }, [issueId]);
  const prompts = [
    t('Summarize this task'),
    t('Suggest an implementation'),
    t('Plan the tests'),
  ];
  return (
    <div
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        color: TASK_TOKENS.textPrimary,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <IconSparkles size={18} />
        <div
          style={{
            flex: 1,
            lineHeight: '20px',
            color: TASK_TOKENS.textSecondary,
          }}
        >
          {t(
            'Private AI conversation. Answers become visible to others only when you share them as a comment.',
          )}
        </div>
      </div>
      {repositories === null ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 12,
            padding: 16,
            background: TASK_TOKENS.backgroundSecondary,
            border: `1px solid ${TASK_TOKENS.borderLight}`,
            borderRadius: TASK_TOKENS.radius,
          }}
        >
          <span
            style={{ color: TASK_TOKENS.textSecondary, lineHeight: '20px' }}
          >
            {t(
              'Get help with this task, its discussion, and all connected project repositories.',
            )}
          </span>
          {isBusy ? (
            <span role="status">{t('Loading conversation…')}</span>
          ) : (
            <TaskButton onClick={() => void initialize()}>
              {t('Retry')}
            </TaskButton>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 12,
              background: TASK_TOKENS.backgroundSecondary,
              border: `1px solid ${TASK_TOKENS.borderLight}`,
              borderRadius: TASK_TOKENS.radius,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: TASK_TOKENS.textSecondary,
              }}
            >
              <IconCode size={14} />
              {repositories.length
                ? t('Source: all project repositories')
                : t('Source: task context only')}
            </div>
            {repositories.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {repositories.map((repository) => (
                  <span
                    key={repository.id}
                    title={repository.slug}
                    style={{
                      padding: '3px 8px',
                      background: TASK_TOKENS.background,
                      border: `1px solid ${TASK_TOKENS.border}`,
                      borderRadius: TASK_TOKENS.radiusExtraSmall,
                      fontSize: 12,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {repository.name || repository.slug}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: TASK_TOKENS.textTertiary }}>
                {t(
                  'Connect repositories in Development to include project code.',
                )}
              </span>
            )}
          </div>
          {isAvailable === false && (
            <div
              role="status"
              style={{
                padding: 12,
                lineHeight: '20px',
                color: TASK_TOKENS.textSecondary,
                background: TASK_TOKENS.backgroundSecondary,
                borderRadius: TASK_TOKENS.radius,
              }}
            >
              {t(
                'AI is not configured for this workspace. Configure an AI provider to ask questions.',
              )}
            </div>
          )}
          {answers.map((answer, index) => (
            <article
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                paddingBottom: 16,
                borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  background: TASK_TOKENS.backgroundSecondary,
                  borderRadius: TASK_TOKENS.radius,
                  lineHeight: '20px',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {answer.question}
              </div>
              <TaskRichTextPreview value={answer.answer} />
              {(
                answer.sources ??
                (answer.sha
                  ? [{ repository: answer.repository, sha: answer.sha }]
                  : [])
              ).map((source) => (
                <span
                  key={source.repository}
                  title={source.sha}
                  style={{
                    fontSize: 11,
                    color: TASK_TOKENS.textTertiary,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {source.repository} · {source.sha.slice(0, 12)}
                </span>
              ))}
              <div>
                <TaskButton
                  size="small"
                  variant="ghost"
                  isDisabled={isBusy}
                  onClick={() => {
                    shareRequestId.current =
                      typeof globalThis.crypto?.randomUUID === 'function'
                        ? globalThis.crypto.randomUUID()
                        : `ai-share-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                    setPreview(answer);
                    setShared(false);
                  }}
                >
                  {t('Preview comment')}
                </TaskButton>
              </div>
            </article>
          ))}
          {answers.length === 0 && !isSending && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {prompts.map((prompt) => (
                <TaskButton
                  key={prompt}
                  size="small"
                  isDisabled={isBusy}
                  onClick={() => {
                    setDraftSeed(prompt);
                    setQuestion(prompt);
                    setDraftKey((previous) => previous + 1);
                  }}
                >
                  {prompt}
                </TaskButton>
              ))}
            </div>
          )}
          {isSending && (
            <article
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {pendingQuestion !== null && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: TASK_TOKENS.backgroundSecondary,
                    borderRadius: TASK_TOKENS.radius,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {pendingQuestion}
                </div>
              )}
              {activity.events.length === 0 && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{ color: TASK_TOKENS.textSecondary }}
                >
                  {progress || t('Preparing advice…')}
                </div>
              )}
            </article>
          )}
          {activity.events.length > 0 && (
            <TaskAiRunTimeline key={activity.runId} events={activity.events} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              key={draftKey}
              ref={questionInput}
              aria-label={t('Ask about this task')}
              placeholder={t(
                'Ask about implementation, relevant code, or tests…',
              )}
              defaultValue={draftSeed}
              maxLength={12000}
              disabled={isBusy}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(event) => {
                if (typeof event.target.value !== 'string') return;
                setQuestion(event.target.value);
              }}
              onKeyDown={(event) => {
                if (
                  event.key !== 'Enter' ||
                  event.shiftKey ||
                  event.nativeEvent.isComposing ||
                  event.keyCode === 229
                )
                  return;
                event.preventDefault();
                if (isBusy || isAvailable === false || !question.trim()) return;
                void send();
              }}
              style={{
                ...getTaskControlStyle(isFocused),
                minHeight: 88,
                padding: '10px 12px',
                resize: 'vertical',
                lineHeight: '20px',
                fontFamily: TASK_TOKENS.fontFamily,
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12, color: TASK_TOKENS.textTertiary }}>
                {t('Enter to send · Shift + Enter for a new line')}
              </span>
              <TaskButton
                variant="primary"
                isDisabled={isBusy || isAvailable === false || !question.trim()}
                onClick={() => void send()}
              >
                <IconSend size={14} />
                {t('Ask AI')}
              </TaskButton>
            </div>
          </div>
          {isBusy && !isSending && preview !== null && (
            <div
              role="status"
              style={{ color: TASK_TOKENS.textSecondary, fontSize: 12 }}
            >
              {t('Sharing comment…')}
            </div>
          )}
        </>
      )}
      {isSending && (
        <div>
          <TaskButton
            size="small"
            isDisabled={cancelRequested}
            onClick={() => {
              setCancelRequested(true);
              void postAppRoute(TASK_AI_ROUTE_PATH, {
                action: 'cancel',
                issueId,
              }).catch((failure) => {
                setError(readErrorText(failure));
                setCancelRequested(false);
              });
            }}
          >
            {cancelRequested
              ? t('Cancelling after current AI call…')
              : t('Cancel reply')}
          </TaskButton>
        </div>
      )}
      {preview !== null && (
        <div
          role="dialog"
          aria-label={t('Preview AI comment')}
          style={{
            padding: 16,
            border: `1px solid ${TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radius,
            background: TASK_TOKENS.backgroundSecondary,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <strong style={{ fontWeight: 500 }}>{t('Preview AI comment')}</strong>
          <TaskRichTextPreview
            value={`**${t('AI-assisted')}**\n\n${formatAnswer(preview)}`}
          />
          <span style={{ fontSize: 12, color: TASK_TOKENS.textSecondary }}>
            {t('This answer will be posted as a comment under your name.')}
          </span>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <TaskButton isDisabled={isBusy} onClick={() => setPreview(null)}>
              {t('Cancel')}
            </TaskButton>
            <TaskButton
              variant="primary"
              isDisabled={isBusy}
              onClick={() => void share()}
            >
              {t('Share as comment')}
            </TaskButton>
          </div>
        </div>
      )}
      {shared && (
        <div role="status" style={{ color: TASK_TOKENS.textSecondary }}>
          {t('Answer shared as a comment.')}
        </div>
      )}
      {error && (
        <div
          role="alert"
          style={{
            color: TASK_TOKENS.textDanger,
            lineHeight: '20px',
            overflowWrap: 'anywhere',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

const formatAnswer = (answer: Answer) => {
  const sources =
    answer.sources ??
    (answer.sha ? [{ repository: answer.repository, sha: answer.sha }] : []);
  return (
    answer.answer +
    sources
      .map(
        (source) =>
          `\n\nRepository: ${source.repository}\nCommit: ${source.sha}`,
      )
      .join('')
  );
};

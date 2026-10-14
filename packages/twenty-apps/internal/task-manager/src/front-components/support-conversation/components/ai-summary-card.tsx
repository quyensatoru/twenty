import { useState } from 'react';
import { enqueueSnackbar, t, useLocale } from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconRefresh,
  IconSparkles,
} from 'twenty-ui/icon';

import { SUPPORT_INBOX_SUMMARIZE_ROUTE_PATH } from '../constants/crisp';
import {
  type SupportInboxConversation,
  type SupportInboxSummarizeResult,
  type SupportInboxSummary,
} from '../types/support-inbox';
import { PULSE_TRANSITION, usePulse } from '../hooks/use-pulse';
import { formatRelativeTime } from '../utils/format-inbox-time.util';
import { parseInlineMarkdown } from '../utils/parse-inline-markdown.util';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';
import { InboxIconButton } from './inbox-icon-button';
import { INBOX_TOKENS, readTone } from './inbox-tokens';
import { InlineMarkdown } from './message-content';

type AiSummaryCardProps = {
  conversation: SupportInboxConversation;
};

const AI_GRADIENT =
  'linear-gradient(135deg, var(--t-color-blue, #1961ed), var(--t-color-purple, #7c3aed))';
const PROBLEM_TONE = readTone('orange');

const readStoredSummary = (
  conversation: SupportInboxConversation,
): SupportInboxSummary | null =>
  conversation.aiSummary === null || conversation.aiSummaryAt === null
    ? null
    : {
        aiSummary: conversation.aiSummary,
        aiProblem: conversation.aiProblem,
        aiNextStep: conversation.aiNextStep,
        aiSummaryAt: conversation.aiSummaryAt,
        aiSummaryMessageCount: conversation.aiSummaryMessageCount ?? 0,
      };

const SummaryLines = ({ text }: { text: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => {
        const isBullet = /^[-*•]\s+/.test(line);
        const content = isBullet ? line.replace(/^[-*•]\s+/, '') : line;

        return (
          <div key={index} style={{ display: 'flex', gap: 8, lineHeight: 1.5 }}>
            {isBullet && (
              <span
                aria-hidden="true"
                style={{
                  background: INBOX_TOKENS.accent,
                  borderRadius: 999,
                  flexShrink: 0,
                  height: 5,
                  marginTop: 8,
                  width: 5,
                }}
              />
            )}
            <span>
              <InlineMarkdown
                nodes={parseInlineMarkdown(content)}
                linkColor={INBOX_TOKENS.accent}
                isOutgoing={false}
              />
            </span>
          </div>
        );
      })}
  </div>
);

const LoadingLines = () => {
  const isDim = usePulse();

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: isDim ? 0.5 : 1,
        transition: PULSE_TRANSITION,
      }}
    >
      {[92, 78, 64].map((width) => (
        <span
          key={width}
          style={{
            background: INBOX_TOKENS.backgroundTertiary,
            borderRadius: 999,
            display: 'block',
            height: 9,
            width: `${width}%`,
          }}
        />
      ))}
    </div>
  );
};

// The summary is written on demand and kept on the conversation, so the next
// agent who opens the chat reads it without paying for another model call.
export const AiSummaryCard = ({ conversation }: AiSummaryCardProps) => {
  const locale = useLocale();
  const [summary, setSummary] = useState<SupportInboxSummary | null>(
    readStoredSummary(conversation),
  );
  const [isSummarizing, setIsSummarizing] = useState(false);
  const shownSummary = summary ?? readStoredSummary(conversation);
  const newMessageCount =
    shownSummary === null
      ? 0
      : Math.max(
          0,
          (conversation.messageCount ?? 0) - shownSummary.aiSummaryMessageCount,
        );

  const summarize = async () => {
    setIsSummarizing(true);

    try {
      const result = await postAppRoute<SupportInboxSummarizeResult>(
        SUPPORT_INBOX_SUMMARIZE_ROUTE_PATH,
        { conversationId: conversation.id, language: locale ?? 'vi' },
      );

      setSummary(result.summary);
    } catch (error) {
      await enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div
      style={{
        background: `linear-gradient(${INBOX_TOKENS.background}, ${INBOX_TOKENS.background}) padding-box, ${AI_GRADIENT} border-box`,
        border: '1px solid transparent',
        borderRadius: 14,
        boxShadow: '0 8px 24px -16px rgba(79,70,229,.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 14,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
        <span
          style={{
            alignItems: 'center',
            background: AI_GRADIENT,
            borderRadius: 8,
            color: '#ffffff',
            display: 'inline-flex',
            flexShrink: 0,
            height: 24,
            justifyContent: 'center',
            width: 24,
          }}
        >
          <IconSparkles size={14} />
        </span>
        <span style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 650 }}>
            {t('AI summary')}
          </span>
          {shownSummary !== null && !isSummarizing && (
            <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 11 }}>
              {formatRelativeTime(shownSummary.aiSummaryAt)}
            </span>
          )}
        </span>
        {shownSummary !== null && (
          <InboxIconButton
            label={t('Summarize again')}
            isDisabled={isSummarizing}
            onClick={() => void summarize()}
          >
            <IconRefresh size={15} />
          </InboxIconButton>
        )}
      </div>

      {isSummarizing ? (
        <>
          <LoadingLines />
          <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 11.5 }}>
            {t('Reading the conversation… long chats can take up to a minute.')}
          </span>
        </>
      ) : shownSummary === null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span
            style={{
              color: INBOX_TOKENS.textSecondary,
              fontSize: 12.5,
              lineHeight: 1.5,
            }}
          >
            {t(
              'Get the gist of this chat, where the customer is stuck and what to do next.',
            )}
          </span>
          <button
            type="button"
            onClick={() => void summarize()}
            style={{
              alignItems: 'center',
              alignSelf: 'flex-start',
              background: AI_GRADIENT,
              border: 'none',
              borderRadius: 10,
              boxShadow: '0 4px 14px -6px rgba(79,70,229,.6)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              gap: 6,
              height: 32,
              padding: '0 14px',
            }}
          >
            <IconSparkles size={14} />
            {t('Summarize')}
          </button>
        </div>
      ) : (
        <div
          style={{
            color: INBOX_TOKENS.textPrimary,
            display: 'flex',
            flexDirection: 'column',
            fontSize: 12.5,
            gap: 10,
          }}
        >
          {shownSummary.aiProblem !== null && (
            <span
              style={{
                alignItems: 'center',
                alignSelf: 'flex-start',
                background: PROBLEM_TONE.background,
                borderRadius: 8,
                color: PROBLEM_TONE.text,
                display: 'inline-flex',
                fontSize: 12,
                fontWeight: 600,
                gap: 6,
                padding: '5px 9px',
              }}
            >
              <IconAlertTriangle size={13} />
              {shownSummary.aiProblem}
            </span>
          )}
          <SummaryLines text={shownSummary.aiSummary} />
          {shownSummary.aiNextStep !== null && (
            <div
              style={{
                background: INBOX_TOKENS.backgroundSecondary,
                border: `1px solid ${INBOX_TOKENS.borderLight}`,
                borderRadius: 10,
                display: 'flex',
                gap: 8,
                lineHeight: 1.5,
                padding: '8px 10px',
              }}
            >
              <span
                style={{
                  color: INBOX_TOKENS.accent,
                  display: 'inline-flex',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <IconArrowRight size={14} />
              </span>
              <span>
                <span style={{ fontWeight: 600 }}>{t('Next step')}: </span>
                {shownSummary.aiNextStep}
              </span>
            </div>
          )}
          {newMessageCount > 0 && (
            <button
              type="button"
              onClick={() => void summarize()}
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: 'none',
                color: INBOX_TOKENS.accent,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11.5,
                fontWeight: 500,
                padding: 0,
              }}
            >
              {t('{count} new messages since, summarize again', {
                count: newMessageCount,
              })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

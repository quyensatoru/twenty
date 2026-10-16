import { TASK_TOKENS } from './task-tokens';
import { type CSSProperties, useState } from 'react';
import { TaskMentionPopover } from './task-mention-popover';
import { t } from 'twenty-sdk/front-component';

import { type MemberRow } from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { readErrorText } from '../utils/read-error-text.util';
import { hasInsertedMentionTrigger } from '../utils/has-inserted-mention-trigger.util';
import {
  buildTaskMentionHref,
  buildTaskMentionMarkdown,
  stripTaskMentionMarkup,
} from '../utils/task-mention-markdown.util';
import { TaskRichTextEditor } from './task-rich-text-editor';
import { TaskButton } from './task-button';
import { TASK_COMPOSER_BOX_STYLE } from './task-control-styles';

export type DiscussionCreateInput = {
  markdown: string;
  parentCommentId?: string;
  requestId: string;
  mentionMemberIds: string[];
};
type DiscussionComposerProps = {
  issueId: string;
  members: MemberRow[];
  parentCommentId?: string;
  onCreate: (input: DiscussionCreateInput) => Promise<void>;
  onDone?: () => void;
  showConfirmation?: boolean;
};

// Tall enough for one line of the host editor plus its padding: 44 with the
// border, the design's single-row composer.
const COMPOSER_MIN_HEIGHT = 42;

export const DiscussionComposer = ({
  issueId,
  members,
  parentCommentId,
  onCreate,
  onDone,
  showConfirmation = true,
}: DiscussionComposerProps) => {
  const [draft, setDraft] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [isMentionMenuDismissed, setIsMentionMenuDismissed] = useState(false);
  const [mentionedMemberIds, setMentionedMemberIds] = useState<string[]>([]);
  const [submission, setSubmission] = useState<{
    input: DiscussionCreateInput;
    status: 'pending' | 'failed' | 'sent';
    error?: string;
  } | null>(null);
  const mentionMatch = draft.match(/@([^@\n]*)\n*$/);
  const membersById = new Map(members.map((member) => [member.id, member]));
  const isMentionOpen = mentionMatch !== null && !isMentionMenuDismissed;
  const mentionPrefix =
    mentionMatch === null ? '' : draft.slice(0, mentionMatch.index);
  const mentionParagraphs =
    stripTaskMentionMarkup(mentionPrefix).split(/\n{2,}/);
  const selectMention = (member: MemberRow) => {
    const name = readMemberName(
      membersById,
      member.id,
      member.userEmail || t('Unknown'),
    );
    setDraft(
      draft.replace(
        /@([^@\n]*)\n*$/,
        () => `${buildTaskMentionMarkdown(member.id, name)} `,
      ),
    );
    setEditorKey((previous) => previous + 1);
    setIsMentionMenuDismissed(true);
    setMentionedMemberIds((previous) => [...new Set([...previous, member.id])]);
  };

  const send = async (input: DiscussionCreateInput) => {
    setSubmission({ input, status: 'pending' });
    try {
      await onCreate(input);
      setSubmission(showConfirmation ? { input, status: 'sent' } : null);
      setDraft('');
      setEditorKey((previous) => previous + 1);
      setIsMentionMenuDismissed(true);
      setMentionedMemberIds([]);
      onDone?.();
    } catch (error) {
      setSubmission({ input, status: 'failed', error: readErrorText(error) });
    }
  };

  return (
    <div
      style={{
        ...TASK_COMPOSER_BOX_STYLE,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* One row: the text and its button side by side, the button staying
          on the last line as the text grows. */}
      <div style={{ alignItems: 'flex-end', display: 'flex', gap: 8 }}>
        <div
          style={{
            // The host editor draws its own frame; inside this box it would be
            // a second border, so its colour is taken away.
            ...({ '--t-border-color-medium': 'transparent' } as CSSProperties),
            display: 'flex',
            flex: 1,
            minWidth: 0,
            position: 'relative',
          }}
        >
          <TaskRichTextEditor
            key={editorKey}
            value={draft}
            issueId={issueId}
            minHeight={COMPOSER_MIN_HEIGHT}
            placeholder={
              parentCommentId
                ? t('Write a reply…')
                : t('Leave a comment, @ to mention')
            }
            isReadOnly={submission?.status === 'pending'}
            onChange={(value) => {
              // A completed mention still contains @; only a new trigger should
              // reopen the popover and move focus into its member search.
              if (hasInsertedMentionTrigger(draft, value))
                setIsMentionMenuDismissed(false);
              setDraft(value);
              if (submission?.status !== 'pending') setSubmission(null);
            }}
          />
          {isMentionOpen && (
            <div
              style={{
                position: 'absolute',
                top: 1,
                left: 1,
                right: 1,
                padding: '8px',
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 13,
                lineHeight: '19.5px',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                pointerEvents: 'none',
                color: 'transparent',
              }}
            >
              {mentionParagraphs.map((paragraph, index) => (
                <div key={index} style={{ padding: '3px 0' }}>
                  <span aria-hidden>{paragraph}</span>
                  {index === mentionParagraphs.length - 1 && (
                    <span
                      style={{
                        display: 'inline-block',
                        position: 'relative',
                        width: 0,
                        height: '19.5px',
                      }}
                    >
                      <twenty-overlay
                        offsetY={24}
                        onClose={() => setIsMentionMenuDismissed(true)}
                      >
                        <TaskMentionPopover
                          members={members}
                          query={mentionMatch![1]}
                          onSelect={selectMention}
                          onClose={() => setIsMentionMenuDismissed(true)}
                        />
                      </twenty-overlay>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, padding: '0 8px 8px 0' }}>
          <TaskButton
            variant="primary"
            size="compact"
            isDisabled={draft.trim() === '' || submission?.status === 'pending'}
            onClick={() =>
              void send(
                submission?.status === 'failed'
                  ? submission.input
                  : {
                      markdown: draft.trim(),
                      parentCommentId,
                      mentionMemberIds: mentionedMemberIds.filter((memberId) =>
                        draft.includes(buildTaskMentionHref(memberId)),
                      ),
                      requestId:
                        typeof globalThis.crypto?.randomUUID === 'function'
                          ? globalThis.crypto.randomUUID()
                          : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
                    },
              )
            }
          >
            {submission?.status === 'pending'
              ? t('Sending…')
              : submission?.status === 'failed'
                ? t('Retry')
                : parentCommentId
                  ? t('Reply')
                  : t('Comment')}
          </TaskButton>
        </div>
      </div>
      {submission !== null && (
        <span
          role="status"
          style={{
            padding: '0 12px 8px',
            color:
              submission.status === 'failed'
                ? TASK_TOKENS.textDanger
                : TASK_TOKENS.textTertiary,
            fontSize: 12,
          }}
        >
          {submission.status === 'failed'
            ? `${t('Failed to send')}: ${submission.error}`
            : submission.status === 'sent'
              ? t('Sent')
              : t('Pending')}
        </span>
      )}
    </div>
  );
};

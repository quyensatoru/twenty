import { useState } from 'react';

import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Avatar } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { BLOCK_SCHEMA } from '@/blocknote-editor/blocks/Schema';
import { BlockEditor } from '@/blocknote-editor/components/BlockEditor';
import { parseInitialBlocknote } from '@/blocknote-editor/utils/parseInitialBlocknote';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useIssueComments } from '@/task-manager/issue-detail/hooks/useIssueComments';

const EMPTY_PARAGRAPH = [{ type: 'paragraph' as const, content: '' }];

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['3']};
`;

const StyledComment = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
`;

const StyledCommentBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['1']};
  min-width: 0;
`;

const StyledCommentHeader = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
`;

const StyledCommentAuthor = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledCommentDate = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledCommentBodyEditor = styled.div`
  & .editor {
    min-height: 0;
  }
`;

const StyledComposer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['2']};
`;

const StyledComposerEditor = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing['1']} ${themeCssVariables.spacing['2']};

  & .editor {
    min-height: 72px;
  }
`;

const isEditorEmpty = (editor: typeof BLOCK_SCHEMA.BlockNoteEditor) =>
  editor.document.every(
    (block) => !Array.isArray(block.content) || block.content.length === 0,
  );

const CommentBody = ({
  blocknote,
}: {
  blocknote: string | null | undefined;
}) => {
  const editor = useCreateBlockNote({
    initialContent: parseInitialBlocknote(blocknote) ?? EMPTY_PARAGRAPH,
    domAttributes: { editor: { class: 'editor' } },
    schema: BLOCK_SCHEMA,
  });

  return (
    <StyledCommentBodyEditor>
      <BlockEditor editor={editor} readonly />
    </StyledCommentBodyEditor>
  );
};

type IssueCommentThreadProps = {
  issueId: string;
};

export const IssueCommentThread = ({ issueId }: IssueCommentThreadProps) => {
  const { t } = useLingui();
  const { comments, postComment } = useIssueComments(issueId);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const [hasContent, setHasContent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const composerEditor = useCreateBlockNote({
    domAttributes: { editor: { class: 'editor' } },
    schema: BLOCK_SCHEMA,
    placeholders: {
      default: t`Write a comment...`,
    },
    pasteHandler: ({ defaultPasteHandler }) =>
      defaultPasteHandler({
        plainTextAsMarkdown: true,
        prioritizeMarkdownOverHTML: true,
      }),
  });

  const handleComposerChange = () => {
    setHasContent(!isEditorEmpty(composerEditor));
  };

  const handleSend = async () => {
    if (isEditorEmpty(composerEditor)) {
      return;
    }

    setIsSending(true);
    try {
      await postComment(
        JSON.stringify(composerEditor.document),
        currentWorkspaceMember?.id,
      );
      composerEditor.replaceBlocks(composerEditor.document, EMPTY_PARAGRAPH);
      setHasContent(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <StyledContainer>
      {comments.map((comment) => {
        const author = comment.author as
          | { name?: { firstName?: string; lastName?: string } }
          | null
          | undefined;
        const authorName = author?.name
          ? `${author.name.firstName ?? ''} ${author.name.lastName ?? ''}`.trim()
          : t`Unknown`;

        return (
          <StyledComment key={comment.id}>
            <Avatar placeholder={authorName} type="rounded" size="md" />
            <StyledCommentBody>
              <StyledCommentHeader>
                <StyledCommentAuthor>{authorName}</StyledCommentAuthor>
                <StyledCommentDate>
                  {new Date(comment.createdAt as string).toLocaleString()}
                </StyledCommentDate>
              </StyledCommentHeader>
              <CommentBody blocknote={comment.bodyV2?.blocknote} />
            </StyledCommentBody>
          </StyledComment>
        );
      })}
      <StyledComposer>
        <StyledComposerEditor>
          <BlockEditor
            editor={composerEditor}
            onChange={handleComposerChange}
          />
        </StyledComposerEditor>
        <Button
          title={t`Comment`}
          onClick={handleSend}
          disabled={isSending || !hasContent}
          accent="blue"
        />
      </StyledComposer>
    </StyledContainer>
  );
};

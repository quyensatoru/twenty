import { useEffect, useRef, useState } from 'react';

import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { createPortal } from 'react-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { Avatar } from 'twenty-ui/data-display';
import {
  IconArrowBackUp,
  IconDotsVertical,
  IconLink,
  IconPencil,
  IconTrash,
} from 'twenty-ui/icon';
import { Button, LightIconButton } from 'twenty-ui/input';
import { MenuItem } from 'twenty-ui/navigation';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useUploadAttachmentFile } from '@/activities/files/hooks/useUploadAttachmentFile';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { BLOCK_SCHEMA } from '@/blocknote-editor/blocks/Schema';
import { BlockEditor } from '@/blocknote-editor/components/BlockEditor';
import { parseInitialBlocknote } from '@/blocknote-editor/utils/parseInitialBlocknote';
import {
  type IssueCommentRecord,
  useIssueComments,
} from '@/task-manager/issue-detail/hooks/useIssueComments';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';

const EMPTY_PARAGRAPH = [{ type: 'paragraph' as const, content: '' }];

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['3']};
`;

const StyledThread = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['2']};
`;

const StyledComment = styled.div<{ isFocused?: boolean }>`
  background-color: ${({ isFocused }) =>
    isFocused ? themeCssVariables.background.transparent.light : 'transparent'};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
  padding: ${themeCssVariables.spacing['1']};
  transition: background-color ${themeCssVariables.animation.duration.slow};
`;

const StyledReplies = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['2']};
  margin-left: ${themeCssVariables.spacing['8']};
`;

const StyledReplyComposer = styled.div`
  margin-left: ${themeCssVariables.spacing['8']};
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

const StyledCommentActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['1']};
  margin-left: auto;
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

const StyledComposerActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
`;

const isEditorEmpty = (editor: typeof BLOCK_SCHEMA.BlockNoteEditor) =>
  editor.document.every(
    (block) => !Array.isArray(block.content) || block.content.length === 0,
  );

const getAuthorName = (
  author: IssueCommentRecord['author'],
  unknownLabel: string,
) =>
  author?.name
    ? `${author.name.firstName ?? ''} ${author.name.lastName ?? ''}`.trim()
    : unknownLabel;

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

const EditableCommentBody = ({
  commentId,
  blocknote,
  onSave,
  onCancel,
}: {
  commentId: string;
  blocknote: string | null | undefined;
  onSave: (blocknote: string) => Promise<void>;
  onCancel: () => void;
}) => {
  const { t } = useLingui();
  const [isSaving, setIsSaving] = useState(false);
  const { uploadAttachmentFile } = useUploadAttachmentFile();

  const handleUploadFile = async (file: File) => {
    const { attachmentAbsoluteURL } = await uploadAttachmentFile(file, {
      id: commentId,
      targetObjectNameSingular: 'issueComment',
    });

    return attachmentAbsoluteURL;
  };

  const editor = useCreateBlockNote({
    initialContent: parseInitialBlocknote(blocknote) ?? EMPTY_PARAGRAPH,
    domAttributes: { editor: { class: 'editor' } },
    schema: BLOCK_SCHEMA,
    uploadFile: handleUploadFile,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(JSON.stringify(editor.document));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledComposer>
      <StyledComposerEditor>
        <BlockEditor editor={editor} />
      </StyledComposerEditor>
      <StyledComposerActions>
        <Button title={t`Cancel`} onClick={onCancel} disabled={isSaving} />
        <Button
          title={t`Save`}
          onClick={handleSave}
          disabled={isSaving}
          accent="blue"
        />
      </StyledComposerActions>
    </StyledComposer>
  );
};

type CommentComposerProps = {
  issueId: string;
  placeholder: string;
  submitLabel: string;
  onSubmit: (blocknote: string) => Promise<void>;
};

const CommentComposer = ({
  issueId,
  placeholder,
  submitLabel,
  onSubmit,
}: CommentComposerProps) => {
  const [hasContent, setHasContent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { uploadAttachmentFile } = useUploadAttachmentFile();

  // The comment doesn't exist yet, so attachments uploaded while composing
  // are targeted at the parent issue instead of the not-yet-created comment.
  const handleUploadFile = async (file: File) => {
    const { attachmentAbsoluteURL } = await uploadAttachmentFile(file, {
      id: issueId,
      targetObjectNameSingular: 'issue',
    });

    return attachmentAbsoluteURL;
  };

  const editor = useCreateBlockNote({
    domAttributes: { editor: { class: 'editor' } },
    schema: BLOCK_SCHEMA,
    uploadFile: handleUploadFile,
    placeholders: {
      default: placeholder,
    },
    pasteHandler: ({ defaultPasteHandler }) =>
      defaultPasteHandler({
        plainTextAsMarkdown: true,
        prioritizeMarkdownOverHTML: true,
      }),
  });

  const handleChange = () => {
    setHasContent(!isEditorEmpty(editor));
  };

  const handleSend = async () => {
    if (isEditorEmpty(editor)) {
      return;
    }

    setIsSending(true);
    try {
      await onSubmit(JSON.stringify(editor.document));
      editor.replaceBlocks(editor.document, EMPTY_PARAGRAPH);
      setHasContent(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <StyledComposer>
      <StyledComposerEditor>
        <BlockEditor editor={editor} onChange={handleChange} />
      </StyledComposerEditor>
      <Button
        title={submitLabel}
        onClick={handleSend}
        disabled={isSending || !hasContent}
        accent="blue"
      />
    </StyledComposer>
  );
};

type CommentRowProps = {
  issueId: string;
  comment: IssueCommentRecord;
  currentWorkspaceMemberId: string | undefined;
  onUpdate: (commentId: string, blocknote: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReply?: () => void;
  isFocused?: boolean;
};

const CommentRow = ({
  issueId,
  comment,
  currentWorkspaceMemberId,
  onUpdate,
  onDelete,
  onReply,
  isFocused = false,
}: CommentRowProps) => {
  const { t } = useLingui();
  const [isEditing, setIsEditing] = useState(false);
  const { openModal } = useModal();
  const { closeDropdown } = useCloseDropdown();
  const { copyToClipboard } = useCopyToClipboard();
  const commentRowRef = useRef<HTMLDivElement>(null);

  const dropdownId = `issue-comment-menu-${comment.id}`;
  const deleteModalId = `issue-comment-delete-modal-${comment.id}`;

  const isAuthor =
    isDefined(currentWorkspaceMemberId) &&
    isDefined(comment.authorId) &&
    comment.authorId === currentWorkspaceMemberId;

  const authorName = getAuthorName(comment.author, t`Unknown`);

  useEffect(() => {
    if (isFocused) {
      commentRowRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isFocused]);

  const handleEdit = () => {
    closeDropdown(dropdownId);
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    closeDropdown(dropdownId);
    openModal(deleteModalId);
  };

  const handleSaveEdit = async (blocknote: string) => {
    await onUpdate(comment.id, blocknote);
    setIsEditing(false);
  };

  const handleCopyCommentLink = () => {
    copyToClipboard(
      `${window.location.origin}${getAppPath(
        AppPath.TaskManagerIssuePage,
        { issueId },
        { commentId: comment.id },
      )}`,
      t`Link copied to clipboard`,
    );
  };

  return (
    <StyledComment ref={commentRowRef} isFocused={isFocused}>
      <Avatar placeholder={authorName} type="rounded" size="md" />
      <StyledCommentBody>
        <StyledCommentHeader>
          <StyledCommentAuthor>{authorName}</StyledCommentAuthor>
          <StyledCommentDate>
            {new Date(comment.createdAt).toLocaleString()}
          </StyledCommentDate>
          <StyledCommentActions>
            <LightIconButton
              className="displayOnHover"
              Icon={IconLink}
              accent="tertiary"
              title={t`Copy link`}
              onClick={handleCopyCommentLink}
            />
            {isDefined(onReply) && (
              <LightIconButton
                className="displayOnHover"
                Icon={IconArrowBackUp}
                accent="tertiary"
                title={t`Reply`}
                onClick={onReply}
              />
            )}
            {isAuthor && (
              <Dropdown
                dropdownId={dropdownId}
                dropdownPlacement="bottom-end"
                clickableComponent={
                  <LightIconButton
                    className="displayOnHover"
                    Icon={IconDotsVertical}
                    accent="tertiary"
                  />
                }
                dropdownComponents={
                  <DropdownContent>
                    <DropdownMenuItemsContainer>
                      <MenuItem
                        LeftIcon={IconPencil}
                        text={t`Edit`}
                        onClick={handleEdit}
                      />
                      <MenuItem
                        LeftIcon={IconTrash}
                        text={t`Delete`}
                        accent="danger"
                        onClick={handleDeleteClick}
                      />
                    </DropdownMenuItemsContainer>
                  </DropdownContent>
                }
              />
            )}
          </StyledCommentActions>
        </StyledCommentHeader>
        {isEditing ? (
          <EditableCommentBody
            commentId={comment.id}
            blocknote={comment.bodyV2?.blocknote}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <CommentBody blocknote={comment.bodyV2?.blocknote} />
        )}
      </StyledCommentBody>
      {createPortal(
        <ConfirmationModal
          modalInstanceId={deleteModalId}
          title={t`Delete Comment`}
          subtitle={t`Are you sure you want to delete this comment? This action cannot be undone.`}
          onConfirmClick={() => onDelete(comment.id)}
          confirmButtonText={t`Delete Comment`}
        />,
        document.body,
      )}
    </StyledComment>
  );
};

type IssueCommentThreadProps = {
  issueId: string;
  focusedCommentId?: string;
};

export const IssueCommentThread = ({
  issueId,
  focusedCommentId,
}: IssueCommentThreadProps) => {
  const { t } = useLingui();
  const { comments, postComment, postReply, updateComment, deleteComment } =
    useIssueComments(issueId);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  return (
    <StyledContainer>
      {comments.map((comment) => (
        <StyledThread key={comment.id}>
          <CommentRow
            issueId={issueId}
            comment={comment}
            currentWorkspaceMemberId={currentWorkspaceMember?.id}
            onUpdate={updateComment}
            onDelete={deleteComment}
            isFocused={comment.id === focusedCommentId}
            onReply={() =>
              setReplyingToId((current) =>
                current === comment.id ? null : comment.id,
              )
            }
          />
          {comment.replies.length > 0 && (
            <StyledReplies>
              {comment.replies.map((reply) => (
                <CommentRow
                  key={reply.id}
                  issueId={issueId}
                  comment={reply}
                  currentWorkspaceMemberId={currentWorkspaceMember?.id}
                  onUpdate={updateComment}
                  onDelete={deleteComment}
                  isFocused={reply.id === focusedCommentId}
                />
              ))}
            </StyledReplies>
          )}
          {replyingToId === comment.id && (
            <StyledReplyComposer>
              <CommentComposer
                issueId={issueId}
                placeholder={t`Write a reply...`}
                submitLabel={t`Reply`}
                onSubmit={async (blocknote) => {
                  await postReply(
                    comment.id,
                    blocknote,
                    currentWorkspaceMember?.id,
                  );
                  setReplyingToId(null);
                }}
              />
            </StyledReplyComposer>
          )}
        </StyledThread>
      ))}
      <CommentComposer
        issueId={issueId}
        placeholder={t`Write a comment...`}
        submitLabel={t`Comment`}
        onSubmit={(blocknote) =>
          postComment(blocknote, currentWorkspaceMember?.id)
        }
      />
    </StyledContainer>
  );
};

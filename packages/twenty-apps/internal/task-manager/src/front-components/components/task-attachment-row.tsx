import { useState } from 'react';
import { IconPaperclip } from 'twenty-ui/icon';

import {
  type IssueAttachmentRow,
  readAttachmentExtension,
} from '../utils/read-issue-attachments.util';
import { TaskCopyLinkButton } from './task-copy-link-button';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

// One file: name, kind, and a link. The link is copied rather than opened,
// because the sandbox cannot open a tab and the host owns the clipboard.
export const TaskAttachmentRow = ({ row }: { row: IssueAttachmentRow }) => {
  // State-driven, because an app ships no stylesheet and there is no `:hover`
  // to declare.
  const [isHovered, setIsHovered] = useState(false);
  const extension =
    typeof row.extension === 'string' && row.extension !== ''
      ? row.extension
      : readAttachmentExtension(row.label);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered
          ? TASK_TOKENS.backgroundTransparentLighter
          : 'transparent',
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 8,
        minHeight: 36,
        padding: '4px 8px',
        width: '100%',
      }}
    >
      <span
        style={{
          alignItems: 'center',
          color: TASK_TOKENS.textTertiary,
          display: 'inline-flex',
          flexShrink: 0,
        }}
      >
        <IconPaperclip size={16} />
      </span>
      <span
        title={row.label}
        style={{
          color: TASK_TOKENS.textPrimary,
          flex: 1,
          fontSize: 13,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {row.label}
      </span>
      {extension !== null && <TaskTag color="gray">{extension}</TaskTag>}
      {typeof row.url === 'string' && row.url !== '' && (
        <TaskCopyLinkButton url={row.url} />
      )}
    </div>
  );
};

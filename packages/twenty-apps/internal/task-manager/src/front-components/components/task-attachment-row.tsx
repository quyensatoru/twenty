import { useState } from 'react';

import {
  type AttachmentKind,
  type IssueAttachmentRow,
  readAttachmentKind,
  readAttachmentRowExtension,
} from '../utils/read-issue-attachments.util';
import { TaskCopyLinkButton } from './task-copy-link-button';
import { readTagColor, TASK_TOKENS } from './task-tokens';

const TILE_COLOR_BY_KIND: Record<AttachmentKind, string> = {
  image: 'purple',
  pdf: 'red',
  code: 'sky',
  other: 'gray',
};

const readFileUrl = (row: IssueAttachmentRow): string | null =>
  typeof row.url === 'string' && row.url !== '' ? row.url : null;

// One file: a tile colored by kind, its name, and a link. The link is copied
// rather than opened, because the sandbox cannot open a tab and the host owns
// the clipboard.
export const TaskAttachmentRow = ({ row }: { row: IssueAttachmentRow }) => {
  // State-driven, because an app ships no stylesheet and there is no `:hover`
  // to declare.
  const [isHovered, setIsHovered] = useState(false);
  const extension = readAttachmentRowExtension(row);
  const tone = readTagColor(TILE_COLOR_BY_KIND[readAttachmentKind(row)]);
  const url = readFileUrl(row);

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
        boxSizing: 'border-box',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 10,
        minHeight: 44,
        minWidth: 0,
        padding: '6px 8px',
        width: '100%',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          alignItems: 'center',
          background: tone.background,
          borderRadius: 7,
          color: tone.text,
          display: 'inline-flex',
          flexShrink: 0,
          fontSize: 9,
          fontWeight: 700,
          height: 32,
          justifyContent: 'center',
          letterSpacing: 0.2,
          overflow: 'hidden',
          textTransform: 'uppercase',
          width: 32,
        }}
      >
        {(extension ?? 'file').slice(0, 4)}
      </span>
      <span
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <span
          title={row.label}
          style={{
            color: TASK_TOKENS.textPrimary,
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.label}
        </span>
        {extension !== null && (
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontSize: 11,
              textTransform: 'uppercase',
            }}
          >
            {extension}
          </span>
        )}
      </span>
      {url !== null && <TaskCopyLinkButton url={url} />}
    </div>
  );
};

// An image drawn as itself: a 4:3 thumbnail with its name along the bottom
// edge. The copy-link button shows on hover so the grid stays a grid.
export const TaskAttachmentThumbnail = ({
  row,
}: {
  row: IssueAttachmentRow;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const url = readFileUrl(row);

  return (
    <div
      title={row.label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: '4 / 3',
        background: TASK_TOKENS.backgroundTertiary,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: 6,
        boxSizing: 'border-box',
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {url !== null && (
        <img
          src={url}
          alt={row.label}
          style={{
            display: 'block',
            height: '100%',
            objectFit: 'cover',
            width: '100%',
          }}
        />
      )}
      <span
        style={{
          background: TASK_TOKENS.background,
          bottom: 0,
          boxSizing: 'border-box',
          color: TASK_TOKENS.textSecondary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 10,
          left: 0,
          opacity: 0.92,
          overflow: 'hidden',
          padding: '1px 4px',
          position: 'absolute',
          right: 0,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {row.label}
      </span>
      {url !== null && (
        <span
          style={{
            background: TASK_TOKENS.background,
            borderRadius: TASK_TOKENS.radiusSmall,
            boxShadow: TASK_TOKENS.shadowLight,
            opacity: isHovered ? 1 : 0,
            position: 'absolute',
            right: 3,
            top: 3,
          }}
        >
          <TaskCopyLinkButton url={url} />
        </span>
      )}
    </div>
  );
};
